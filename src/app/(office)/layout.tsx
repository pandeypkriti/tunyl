import { redirect } from "next/navigation";
import { isOffice, officeName } from "@/lib/auth";
import { AppShell } from "@/components/app/app-shell";
import { reviewQueue } from "@/lib/records";
import { briefing, nextActions } from "@/lib/next-actions";
import { recentActions, timeAgo, KIND_LABEL } from "@/lib/actions-log";

export const dynamic = "force-dynamic";

export default async function OfficeLayout({ children }: { children: React.ReactNode }) {
  if (!(await isOffice())) redirect("/login");
  const name = await officeName();
  let queueCount = 0, brief: Awaited<ReturnType<typeof briefing>> = [], next: Awaited<ReturnType<typeof nextActions>> = [], recent: Array<{ id: string; who: string; did: string; subject: string; when: string; href: string }> = [];
  try {
    const [q, b, n, r] = await Promise.all([reviewQueue(), briefing(), nextActions(name), recentActions(6)]);
    queueCount = q.length; brief = b; next = n;
    recent = r.map((a) => ({ id: a.id, who: a.actor, did: KIND_LABEL[a.kind], subject: a.subject, when: timeAgo(a.createdAt), href: a.href }));
  } catch (e) { console.error("shell data failed", e); }
  return <AppShell queueCount={queueCount} name={name} brief={brief} next={next} recent={recent}>{children}</AppShell>;
}
