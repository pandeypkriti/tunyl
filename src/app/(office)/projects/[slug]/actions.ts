"use server";
// Anything that moves money is a draft until a person confirms it here.
import { revalidatePath } from "next/cache";
import { draftClaim, lodgeClaim } from "@/lib/claims";

export async function draftClaimAction(projectId: string, slug: string) {
  const claim = await draftClaim(projectId);
  revalidatePath(`/projects/${slug}`);
  return claim;
}

export async function lodgeClaimAction(claimId: string, slug: string) {
  const claim = await lodgeClaim(claimId);
  revalidatePath(`/projects/${slug}`);
  revalidatePath("/", "layout");
  return claim;
}
