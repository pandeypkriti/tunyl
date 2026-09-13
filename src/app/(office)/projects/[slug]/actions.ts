"use server";
// Anything that moves money is a draft until a person confirms it here.
import { revalidatePath } from "next/cache";
import { draftClaim, lodgeClaim } from "@/lib/claims";
import { officeName } from "@/lib/auth";
import { logAction } from "@/lib/actions-log";
import { money } from "@/lib/units";

export async function draftClaimAction(projectId: string, slug: string) {
  const claim = await draftClaim(projectId);
  await logAction({ actor: await officeName(), kind: "draft_claim", subject: `claim ${claim.number}, ${money(claim.total)}`, href: `/projects/${slug}`, projectId });
  revalidatePath(`/projects/${slug}`);
  return claim;
}

export async function lodgeClaimAction(claimId: string, slug: string) {
  const claim = await lodgeClaim(claimId);
  await logAction({ actor: await officeName(), kind: "lodge_claim", subject: `claim ${claim.number}, ${money(claim.total)}`, href: `/claims/${claim.id}`, projectId: claim.projectId });
  revalidatePath(`/projects/${slug}`);
  revalidatePath("/", "layout");
  return claim;
}
