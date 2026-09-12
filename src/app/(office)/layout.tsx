import { redirect } from "next/navigation";
import { isOffice, officeName } from "@/lib/auth";
import { AppShell } from "@/components/app/app-shell";
import { reviewQueue } from "@/lib/records";

export const dynamic = "force-dynamic";

export default async function OfficeLayout({ children }: { children: React.ReactNode }) {
  if (!(await isOffice())) redirect("/login");
  let queueCount = 0;
  try { queueCount = (await reviewQueue()).length; } catch { queueCount = 0; }
  const name = await officeName();
  return <AppShell queueCount={queueCount} name={name}>{children}</AppShell>;
}
