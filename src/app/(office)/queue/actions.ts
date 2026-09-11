"use server";
// The two moves out of the review queue: a person ticks it in, or sends it back.
import { revalidatePath } from "next/cache";
import { approveRecord, sendBackRecord } from "@/lib/records";
import { officeName } from "@/lib/auth";

export async function approveQueueRecord(id: string, qty: number, unit: string) {
  const tickedBy = await officeName();
  const updated = await approveRecord(id, { qty, unit, tickedBy });
  revalidatePath("/queue");
  revalidatePath("/", "layout");
  return updated;
}

export async function sendBackQueueRecord(id: string) {
  const tickedBy = await officeName();
  const updated = await sendBackRecord(id, tickedBy);
  revalidatePath("/queue");
  revalidatePath("/", "layout");
  return updated;
}
