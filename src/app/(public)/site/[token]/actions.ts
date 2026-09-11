"use server";

// Server actions for the supervisor's phone page. No login: the site token in
// the URL is the only gate, so every action re-checks it against the project.
import { put } from "@vercel/blob";
import { projectBySiteToken, materialsFor, createRecordFromReading } from "@/lib/records";
import { evaluateRule } from "@/lib/rules";
import type { ReadField, Flag, RecordStatus } from "@/db/schema";

/**
 * The rule hint under the fields. Runs the same rule the office relies on, so
 * the site sees the same answer before it sends anything.
 */
export async function evaluate(
  token: string,
  fields: ReadField[],
  po: string,
  materialText: string,
): Promise<{ pass: boolean; why: string }> {
  const project = await projectBySiteToken(token);
  if (!project) return { pass: false, why: "This link is not recognised." };
  const materials = await materialsFor(project.id);
  const result = evaluateRule(fields, po, materialText, materials);
  return { pass: result.pass, why: result.why };
}

export type SendDocketInput = {
  kind: string;
  fields: ReadField[];
  flags: Flag[];
  po: string;
  imageB64: string; // JPEG, base64, no "data:" prefix
};

/** The site sends the docket. Store the photo once, then let the office rule decide. */
export async function sendDocket(
  token: string,
  input: SendDocketInput,
): Promise<{ status: RecordStatus; why: string; fed: string }> {
  const project = await projectBySiteToken(token);
  if (!project) throw new Error("This link is not recognised.");

  const buffer = Buffer.from(input.imageB64, "base64");
  const blob = await put(`dockets/${project.slug}/${Date.now()}.jpg`, buffer, {
    access: "public",
    contentType: "image/jpeg",
  });

  const { record } = await createRecordFromReading(project.id, {
    kind: input.kind,
    fields: input.fields,
    flags: input.flags,
    po: input.po,
    imageUrl: blob.url,
    source: "photo",
  });

  return { status: record.status, why: record.why, fed: record.fed };
}
