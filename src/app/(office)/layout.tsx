import { redirect } from "next/navigation";
import { isOffice } from "@/lib/auth";
import { OfficeShell } from "@/components/office-shell";
import { reviewQueue } from "@/lib/records";

export const dynamic = "force-dynamic";

export default async function OfficeLayout({ children }: { children: React.ReactNode }) {
  if (!(await isOffice())) redirect("/login");
  let queueCount = 0;
  try { queueCount = (await reviewQueue()).length; } catch { queueCount = 0; }
  return <OfficeShell queueCount={queueCount}>{children}</OfficeShell>;
}
