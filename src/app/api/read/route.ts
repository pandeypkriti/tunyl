// The site sends a photo, this reads it. One vision-model call, shaped into
// the ten fields the app stores. Never invents a number: see src/lib/reader.ts.
import { NextResponse } from "next/server";
import { readDocket, toFields, toFlags } from "@/lib/reader";

const MAX_BYTES = 6 * 1024 * 1024; // ~6 MB, the client already resizes before this ever gets hit

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength && contentLength > MAX_BYTES) {
    return NextResponse.json({ error: "That photo is too large. Retake it and try again." }, { status: 413 });
  }

  let body: { imageB64?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The photo did not arrive in a readable format." }, { status: 400 });
  }

  const imageB64 = body?.imageB64;
  if (typeof imageB64 !== "string" || !imageB64) {
    return NextResponse.json({ error: "No photo was sent." }, { status: 400 });
  }
  // base64 runs about a third larger than the original bytes
  if (imageB64.length > MAX_BYTES * 1.4) {
    return NextResponse.json({ error: "That photo is too large. Retake it and try again." }, { status: 413 });
  }

  try {
    const reading = await readDocket(imageB64);
    return NextResponse.json({
      reading,
      fields: toFields(reading),
      flags: toFlags(reading),
      po: reading.purchaseOrder.value,
      kind: reading.kind,
      isDocket: reading.isDocket,
    });
  } catch (e) {
    const err = e as { code?: string; message?: string };
    if (err.code === "NO_KEY") {
      return NextResponse.json(
        { error: "The reader is not configured yet. Add OPENAI_API_KEY (or ANTHROPIC_API_KEY) in Vercel." },
        { status: 503 },
      );
    }
    if (err.code === "REFUSAL") {
      return NextResponse.json({ error: err.message || "The reader could not read this photo." }, { status: 422 });
    }
    console.error("read docket failed:", err);
    return NextResponse.json({ error: "The reader could not read this photo. Try again." }, { status: 500 });
  }
}
