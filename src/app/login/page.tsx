import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ bad?: string }> }) {
  const sp = await searchParams;
  async function action(formData: FormData) {
    "use server";
    const ok = await signIn(String(formData.get("passcode") || ""));
    const name = String(formData.get("name") || "").trim();
    if (ok) {
      if (name) { const { cookies } = await import("next/headers"); (await cookies()).set("tunyl_name", name, { path: "/", maxAge: 60 * 60 * 24 * 90, sameSite: "lax" }); }
      redirect("/");
    }
    redirect("/login?bad=1");
  }
  return (
    <div className="mx-auto max-w-[420px] px-5 pt-16">
      <div className="flex items-baseline gap-2.5 pb-6"><b className="text-[18px] font-bold">Tunyl</b><span className="text-[color:var(--ink2)]">Docket to claim</span></div>
      <div className="card">
        <h1 className="text-[22px]">Office sign in</h1>
        <p className="mt-1.5 text-[color:var(--ink2)]">Your name goes on every docket you tick.</p>
        <form action={action} className="mt-4 grid gap-3">
          <label className="grid gap-1 text-[13px] font-medium text-[color:var(--ink2)]">Your name<Input name="name" placeholder="e.g. Mel R." autoComplete="name" /></label>
          <label className="grid gap-1 text-[13px] font-medium text-[color:var(--ink2)]">Office passcode<Input name="passcode" type="password" autoComplete="current-password" required /></label>
          {sp.bad && <p className="rounded-xl bg-[color:var(--crit-bg)] px-3 py-2 text-[14px] text-[color:var(--crit-ink)]">That passcode did not match.</p>}
          <Button type="submit">Sign in</Button>
        </form>
      </div>
    </div>
  );
}
