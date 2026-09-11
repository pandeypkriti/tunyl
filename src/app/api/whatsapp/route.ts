// Twilio WhatsApp inbound webhook. A driver or supervisor texts a photo of a
// docket to the Tunyl number; this maps them to a project, reads the docket
// the same way the site page does, and replies with what was read and where
// it landed. No login: the phone number, or a site code typed in the message,
// is the gate.
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { readDocket, toFields, toFlags } from "@/lib/reader";
import { projectBySiteToken, materialsFor, createRecordFromReading } from "@/lib/records";
import { evaluateRule } from "@/lib/rules";
import type { ReadField, Flag, Project } from "@/db/schema";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function twiml(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${esc(message)}</Message></Response>`;
}

function reply(message: string): NextResponse {
  return new NextResponse(twiml(message), { status: 200, headers: { "Content-Type": "text/xml" } });
}

function fieldValue(fields: ReadField[], label: string): string {
  return fields.find((f) => f.label === label)?.value?.trim() ?? "";
}

async function findProjectByPhone(from: string): Promise<Project | null> {
  const phone = from.replace(/^whatsapp:/i, "").trim();
  let map: Record<string, string> = {};
  try {
    map = JSON.parse(process.env.WHATSAPP_PROJECT_MAP || "{}");
  } catch {
    console.error("WHATSAPP_PROJECT_MAP is not valid JSON");
  }
  const token = map[phone];
  return token ? projectBySiteToken(token) : null;
}

async function findProjectInBody(body: string): Promise<Project | null> {
  const words = body.toLowerCase().split(/[^a-z0-9-]+/).filter((w) => w.length >= 4);
  for (const word of words.slice(0, 25)) {
    const project = await projectBySiteToken(word);
    if (project) return project;
  }
  return null;
}

async function uploadPhoto(slug: string, buffer: Buffer, contentType: string) {
  const blob = await put(`dockets/${slug}/${Date.now()}.jpg`, buffer, {
    access: "public",
    contentType: contentType || "image/jpeg",
  });
  return blob.url;
}

export async function GET() {
  return NextResponse.json({
    service: "Tunyl WhatsApp inbound",
    description: "Twilio webhook. A supervisor texts a photo of a docket and it is read and filed against their project.",
    method: "POST, application/x-www-form-urlencoded (Twilio's inbound message format)",
    fields: ["From", "Body", "NumMedia", "MediaUrl0", "MediaContentType0"],
    env: ["WHATSAPP_PROJECT_MAP", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"],
  });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const from = String(form.get("From") || "");
  const body = String(form.get("Body") || "");
  const numMedia = parseInt(String(form.get("NumMedia") || "0"), 10) || 0;
  const mediaUrl = String(form.get("MediaUrl0") || "");
  const mediaType = String(form.get("MediaContentType0") || "image/jpeg");

  const project = (await findProjectByPhone(from)) || (await findProjectInBody(body));
  if (!project) {
    return reply(
      "We don't recognise this number. Text the site code for your project (for example kr-gate2-7f3a) so we know where to file the photo.",
    );
  }

  if (numMedia < 1 || !mediaUrl) {
    return reply(`Send a photo of the docket for ${project.name} and we'll read it.`);
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !authToken) {
    return reply("Twilio is not fully set up yet. Ask the office to add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
  }

  let buffer: Buffer;
  try {
    const auth = Buffer.from(`${sid}:${authToken}`).toString("base64");
    const res = await fetch(mediaUrl, { headers: { Authorization: `Basic ${auth}` } });
    if (!res.ok) throw new Error(`media fetch failed, ${res.status}`);
    buffer = Buffer.from(await res.arrayBuffer());
  } catch (e) {
    console.error("whatsapp media download failed:", e);
    return reply("The photo did not come through properly. Send it again.");
  }

  let readingFields: ReadField[] = [];
  let readingFlags: Flag[] = [];
  let po = "";
  let kind = "delivery";
  try {
    const reading = await readDocket(buffer.toString("base64"));
    if (!reading.isDocket) {
      const flags = toFlags(reading);
      return reply(`That doesn't look like a docket. ${flags[0]?.text || "Send a photo of the delivery docket."}`);
    }
    readingFields = toFields(reading);
    readingFlags = toFlags(reading);
    po = reading.purchaseOrder.value;
    kind = reading.kind;
  } catch (e) {
    const err = e as { code?: string; message?: string };
    if (err.code === "NO_KEY") {
      // Still file the photo. The office types it in by hand.
      const imageUrl = await uploadPhoto(project.slug, buffer, mediaType);
      await createRecordFromReading(project.id, { kind: "delivery", fields: [], flags: [], po: "", imageUrl, source: "whatsapp" });
      return reply("Got the photo. The reader is not switched on yet, so the office will type it in. It's filed as waiting.");
    }
    console.error("whatsapp read failed:", err);
    return reply(err.message || "The reader could not read this photo. Send it again in better light.");
  }

  const imageUrl = await uploadPhoto(project.slug, buffer, mediaType);
  const mats = await materialsFor(project.id);
  const materialText = fieldValue(readingFields, "Material");
  const rule = evaluateRule(readingFields, po, materialText, mats);
  await createRecordFromReading(project.id, { kind, fields: readingFields, flags: readingFlags, po, imageUrl, source: "whatsapp" });

  const supplier = fieldValue(readingFields, "Supplier") || "supplier";
  const ref = fieldValue(readingFields, "Docket number") || "?";
  const material = materialText || "material";
  const qty = fieldValue(readingFields, "Quantity") || "?";
  const unit = fieldValue(readingFields, "Unit");
  const notClear = readingFields.filter((f) => f.state !== "clear" && f.label !== "Purchase order").map((f) => f.label.toLowerCase());

  const readLine =
    `Read: ${supplier}, docket ${ref}, ${material} ${qty}${unit ? " " + unit : ""}${po ? ", " + po : ""}. ` +
    (notClear.length ? `${notClear.length} to check: ${notClear.join(", ")}.` : "Every field reads ok.");
  const nextLine = rule.pass
    ? "Matched the purchase order. It is in the ledger. Reply FIX if the paper says otherwise."
    : `Sent to the office. ${rule.why}`;

  return reply(`${readLine}\n${nextLine}`);
}
