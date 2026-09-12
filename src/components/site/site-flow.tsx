"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stepper, type Step } from "@/components/app/stepper";
import { StatusChip } from "@/components/app/status-chip";
import { FieldEditor, blankFields } from "./field-editor";
import { resizeImageToJpeg } from "./resize-image";
import { evaluate, sendDocket } from "@/app/(public)/site/[token]/actions";
import type { ReadField, Flag, RecordStatus } from "@/db/schema";

type ReviewState = {
  photoDataUrl: string;
  photoB64: string;
  kind: string;
  fields: ReadField[];
  flags: Flag[];
  manual: boolean;
  notice?: string;
};

type Stage =
  | { name: "idle" }
  | { name: "reading"; photoDataUrl: string; photoB64: string }
  | { name: "stopped"; photoDataUrl: string; photoB64: string }
  | { name: "read-error"; photoDataUrl: string; photoB64: string; message: string }
  | { name: "not-docket"; photoDataUrl: string; flags: Flag[] }
  | { name: "review"; review: ReviewState }
  | { name: "sending"; review: ReviewState }
  | { name: "send-error"; review: ReviewState; message: string }
  | { name: "sent"; status: RecordStatus; why: string; fed: string };

type ReadResponse = {
  fields?: ReadField[];
  flags?: Flag[];
  po?: string;
  kind?: string;
  isDocket?: boolean;
  error?: string;
};

function fieldValue(fields: ReadField[], label: string): string {
  return fields.find((f) => f.label === label)?.value.trim() ?? "";
}

/** The three-step progress at the top of the reader: photographed, read, then
 * matched by rule or waiting on a person. Hidden before a photo exists and on
 * the final result screen, which has its own resolution UI. */
function readerSteps(stage: Stage): Step[] {
  const photographed: Step = { label: "Photographed", state: "done" };
  switch (stage.name) {
    case "idle":
      return [];
    case "reading":
      return [photographed, { label: "Read", state: "current" }, { label: "Waiting for the office", state: "todo" }];
    case "stopped":
      return [photographed, { label: "Read", state: "blocked", hint: "Stopped before it finished" }, { label: "Waiting for the office", state: "todo" }];
    case "read-error":
      return [photographed, { label: "Read", state: "blocked", hint: stage.message }, { label: "Waiting for the office", state: "todo" }];
    case "not-docket":
      return [photographed, { label: "Read", state: "blocked", hint: "Did not look like a docket" }, { label: "Waiting for the office", state: "todo" }];
    case "review":
      return [photographed, { label: "Read", state: "done" }, { label: "Waiting for the office", state: "todo" }];
    case "sending":
      return [photographed, { label: "Read", state: "done" }, { label: "Waiting for the office", state: "current" }];
    case "send-error":
      return [photographed, { label: "Read", state: "done" }, { label: "Waiting for the office", state: "blocked", hint: stage.message }];
    case "sent":
      return [
        photographed,
        { label: "Read", state: "done" },
        stage.status === "rule"
          ? { label: "Matched by rule", state: "done" }
          : { label: "Waiting for the office", state: "current" },
      ];
  }
}

export function SiteFlow({ token, materialNames }: { token: string; materialNames: string[] }) {
  const [stage, setStage] = useState<Stage>({ name: "idle" });
  const [warning, setWarning] = useState("");
  const [ruleHint, setRuleHint] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const review =
    stage.name === "review" || stage.name === "sending" || stage.name === "send-error" ? stage.review : null;

  // Recompute the rule hint against the office rule as the supervisor edits
  // fields, debounced so it is not one round trip per keystroke.
  useEffect(() => {
    if (!review) return;
    const timer = setTimeout(() => {
      const po = fieldValue(review.fields, "Purchase order");
      const materialText = fieldValue(review.fields, "Material");
      evaluate(token, review.fields, po, materialText)
        .then((r) => setRuleHint(r.why))
        .catch(() => setRuleHint(""));
    }, 300);
    return () => clearTimeout(timer);
  }, [token, review]);

  useEffect(() => {
    return () => {
      if (warnTimer.current) clearTimeout(warnTimer.current);
    };
  }, []);

  function flashWarning(text: string) {
    setWarning(text);
    if (warnTimer.current) clearTimeout(warnTimer.current);
    warnTimer.current = setTimeout(() => setWarning(""), 3500);
  }

  function startRead(photoDataUrl: string, photoB64: string) {
    setWarning("");
    setStage({ name: "reading", photoDataUrl, photoB64 });
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      let res: Response;
      try {
        res = await fetch("/api/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageB64: photoB64 }),
          signal: controller.signal,
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          setStage({ name: "stopped", photoDataUrl, photoB64 });
        } else {
          setStage({
            name: "read-error",
            photoDataUrl,
            photoB64,
            message: "Could not reach the reader. Check your connection and try again.",
          });
        }
        return;
      }

      let body: ReadResponse = {};
      try {
        body = await res.json();
      } catch {
        body = {};
      }

      if (res.status === 503) {
        setRuleHint("");
        setStage({
          name: "review",
          review: {
            photoDataUrl,
            photoB64,
            kind: "delivery",
            fields: blankFields(),
            flags: [],
            manual: true,
            notice: "The reader is not switched on for this site yet. Type in what the docket says, then send it.",
          },
        });
        return;
      }
      if (!res.ok) {
        setStage({ name: "read-error", photoDataUrl, photoB64, message: body.error || "The reader could not read this photo. Try again." });
        return;
      }
      if (body.isDocket === false) {
        setStage({ name: "not-docket", photoDataUrl, flags: body.flags || [] });
        return;
      }
      setRuleHint("");
      setStage({
        name: "review",
        review: { photoDataUrl, photoB64, kind: body.kind || "delivery", fields: body.fields || [], flags: body.flags || [], manual: false },
      });
    })();
  }

  async function handleFile(file: File) {
    setWarning("");
    try {
      const { base64, dataUrl } = await resizeImageToJpeg(file);
      startRead(dataUrl, base64);
    } catch {
      flashWarning("That photo could not be used. Try a different one.");
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleFile(file);
  }

  function stop() {
    abortRef.current?.abort();
  }

  function updateField(label: string, value: string) {
    setStage((prev) => {
      if (prev.name !== "review") return prev;
      return { name: "review", review: { ...prev.review, fields: prev.review.fields.map((f) => (f.label === label ? { ...f, value } : f)) } };
    });
  }

  function reset() {
    setStage({ name: "idle" });
    setWarning("");
  }

  async function send() {
    if (!review) return;
    const qty = parseFloat(fieldValue(review.fields, "Quantity"));
    const material = fieldValue(review.fields, "Material");
    if (!material || !Number.isFinite(qty) || qty <= 0) {
      flashWarning("A material and a quantity above zero are needed before it can be sent.");
      return;
    }
    setStage({ name: "sending", review });
    try {
      const po = fieldValue(review.fields, "Purchase order");
      const result = await sendDocket(token, { kind: review.kind, fields: review.fields, flags: review.flags, po, imageB64: review.photoB64 });
      setStage({ name: "sent", status: result.status, why: result.why, fed: result.fed });
    } catch (e) {
      console.error("send docket failed:", e);
      setStage({ name: "send-error", review, message: "Could not send this docket. Check your connection and try again." });
    }
  }

  function retryRead() {
    if (stage.name === "read-error" || stage.name === "stopped") startRead(stage.photoDataUrl, stage.photoB64);
  }

  const photo =
    stage.name === "reading" || stage.name === "stopped" || stage.name === "read-error"
      ? stage.photoDataUrl
      : stage.name === "not-docket"
        ? stage.photoDataUrl
        : review
          ? review.photoDataUrl
          : null;

  const status =
    stage.name === "reading"
      ? { text: "Reading the docket, this can take up to a minute.", kind: undefined, busy: true, stop: true }
      : stage.name === "sending"
        ? { text: "Sending to the office…", kind: undefined, busy: true, stop: false }
        : stage.name === "read-error"
          ? { text: stage.message, kind: "err" as const, busy: false, stop: false, canRetry: true }
          : stage.name === "send-error"
            ? { text: stage.message, kind: "err" as const, busy: false, stop: false }
            : stage.name === "stopped"
              ? {
                  text: "Stopped before it finished.",
                  kind: "warn" as const,
                  busy: false,
                  stop: false,
                  canRetry: true,
                }
              : warning
                ? { text: warning, kind: "warn" as const, busy: false, stop: false }
                : review?.notice
                  ? { text: review.notice, kind: "warn" as const, busy: false, stop: false }
                  : null;

  const busyPicking = stage.name === "reading" || stage.name === "sending";
  const steps = readerSteps(stage);

  return (
    <div>
      {stage.name !== "sent" && (
        <label
          htmlFor="docket-photo"
          className={cn(
            "flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[color:var(--primary)] px-5 text-center text-[16px] font-semibold text-white transition-colors",
            "hover:bg-[color:var(--primary-hover)] focus-within:ring-[3px] focus-within:ring-[color:var(--primary-soft)] focus-within:ring-offset-2",
            busyPicking && "pointer-events-none opacity-50",
          )}
        >
          {stage.name === "idle" ? "Take or choose a photo" : "Take or choose a different photo"}
          <input
            id="docket-photo"
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={busyPicking}
            onChange={onPickFile}
          />
        </label>
      )}

      {steps.length > 0 && stage.name !== "sent" && <Stepper steps={steps} className="mt-5" />}

      {status && (
        <div className={cn("status", status.kind)} role="status" aria-live="polite" {...(status.busy ? { "data-busy": "" } : {})}>
          <span className="dot" />
          <span className="flex-1">{status.text}</span>
          {status.stop && (
            <Button variant="ghost" className="h-8 px-3 text-sm" onClick={stop}>
              Stop
            </Button>
          )}
          {"canRetry" in status && status.canRetry && (
            <Button variant="ghost" className="h-8 px-3 text-sm" onClick={retryRead}>
              Try again
            </Button>
          )}
        </div>
      )}

      {photo && (stage.name === "reading" || stage.name === "stopped" || stage.name === "read-error" || stage.name === "not-docket") && (
        <div className="doc mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="Docket photo" />
          <p className="cap">Your photo</p>
        </div>
      )}

      {stage.name === "not-docket" && (
        <p className="mt-4 text-[15px] leading-relaxed text-[color:var(--ink)]">
          {stage.flags[0]?.text || "That does not look like a delivery docket."}
        </p>
      )}

      {review && (
        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[18px] font-semibold">What was read</h2>
            <StatusChip tone="neutral">{review.manual ? "Typed by hand" : "Read by AI"}</StatusChip>
          </div>
          <div className="grid gap-4 sm:grid-cols-[240px_1fr] sm:items-start">
            <div className="doc">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={review.photoDataUrl} alt="Docket photo" />
              <p className="cap">Your photo</p>
            </div>
            <div>
              <FieldEditor
                fields={review.fields}
                flags={review.flags}
                materialNames={materialNames}
                disabled={stage.name === "sending"}
                onChange={updateField}
              />
              {review && ruleHint && <p className="mt-3 text-[14px] text-[color:var(--ink-2)]">{ruleHint}</p>}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button className="h-11 flex-1 px-5 text-[15px]" disabled={stage.name === "sending"} onClick={send}>
                  {stage.name === "sending" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Sending
                    </>
                  ) : (
                    "Send to the office"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-5 text-[15px]"
                  disabled={stage.name === "sending"}
                  onClick={reset}
                >
                  Discard
                </Button>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--ink-3)]">
                The site does not tick anything. If every field reads ok and the docket matches the purchase order, it goes straight to the
                ledger. Otherwise it waits for the office.
              </p>
            </div>
          </div>
        </section>
      )}

      {stage.name === "sent" && (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-[color:var(--border)] bg-white p-8 py-10 text-center shadow-[var(--shadow)]">
          {stage.status === "rule" ? (
            <>
              <div className="flex size-16 items-center justify-center rounded-full bg-[color:var(--success-soft)]">
                <CheckCircle2 className="size-9 text-[color:var(--success-ink)]" aria-hidden />
              </div>
              <div>
                <p className="text-[18px] font-semibold leading-snug">In the ledger</p>
                <p className="mt-1 text-[14px] text-[color:var(--ink-2)]">{stage.fed || "Matched the purchase order. Nobody typed it."}</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex size-16 items-center justify-center rounded-full bg-[color:var(--warn-soft)]">
                <Clock3 className="size-9 text-[color:var(--warn-ink)]" aria-hidden />
              </div>
              <div>
                <p className="text-[18px] font-semibold leading-snug">Waiting for the office</p>
                <p className="mt-1 text-[14px] text-[color:var(--ink-2)]">{stage.why}</p>
              </div>
            </>
          )}
          <Button className="h-11 px-6 text-[15px]" onClick={reset}>
            Send another docket
          </Button>
        </div>
      )}
    </div>
  );
}
