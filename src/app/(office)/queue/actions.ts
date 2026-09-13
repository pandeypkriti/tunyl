"use server";
// The moves out of the review queue: a person ticks it in, sends it back, or holds it.
import { revalidatePath } from "next/cache";
import { approveRecord, sendBackRecord, holdRecord } from "@/lib/records";
import { officeName } from "@/lib/auth";
import { logAction } from "@/lib/actions-log";

function revalidateQueueViews() {
  revalidatePath("/queue");
  revalidatePath("/", "layout");
  revalidatePath("/projects", "layout");
  revalidatePath("/documents");
}

export async function approveQueueRecord(id: string, qty: number, unit: string) {
  const tickedBy = await officeName();
  const updated = await approveRecord(id, { qty, unit, tickedBy });
  await logAction({ actor: tickedBy, kind: "tick", subject: updated.title, href: `/queue/${id}`, projectId: updated.projectId });
  revalidateQueueViews();
  return updated;
}

export async function sendBackQueueRecord(id: string) {
  const tickedBy = await officeName();
  const updated = await sendBackRecord(id, tickedBy);
  await logAction({ actor: tickedBy, kind: "send_back", subject: updated.title, href: `/queue/${id}`, projectId: updated.projectId });
  revalidateQueueViews();
  return updated;
}

/** For an invoice with loads that have no docket: keep it held while the rest goes through. */
export async function holdQueueRecord(id: string, why?: string) {
  const updated = await holdRecord(id, why || "Held: the unmatched loads still need a docket from site.");
  await logAction({ actor: await officeName(), kind: "hold", subject: updated.title, href: `/queue/${id}`, projectId: updated.projectId });
  revalidateQueueViews();
  return updated;
}
