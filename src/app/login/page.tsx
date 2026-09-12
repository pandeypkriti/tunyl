import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignInButton } from "./submit-button";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ bad?: string }> }) {
  const sp = await searchParams;

  async function action(formData: FormData) {
    "use server";
    const ok = await signIn(String(formData.get("passcode") || ""));
    const name = String(formData.get("name") || "").trim();
    if (ok) {
      if (name) {
        const { cookies } = await import("next/headers");
        (await cookies()).set("tunyl_name", name, { path: "/", maxAge: 60 * 60 * 24 * 90, sameSite: "lax" });
      }
      redirect("/");
    }
    redirect("/login?bad=1");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--bg)] px-4 py-16">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 text-center text-[20px] font-semibold tracking-[-0.01em] text-[color:var(--ink)]">Tunyl</div>
        <div className="rounded-xl border border-[color:var(--border)] bg-white p-6 shadow-[var(--shadow)]">
          <h1 className="text-[20px] font-semibold">Office sign in</h1>
          <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">Your name goes on every docket you tick.</p>
          <form action={action} className="mt-5 grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" name="name" placeholder="e.g. Mel R." autoComplete="name" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="passcode">Office passcode</Label>
              <Input id="passcode" name="passcode" type="password" autoComplete="current-password" required />
            </div>
            {sp.bad && (
              <p className="rounded-md bg-[color:var(--danger-soft)] px-3 py-2 text-[13px] text-[color:var(--danger-ink)]">
                That passcode did not match.
              </p>
            )}
            <SignInButton />
          </form>
        </div>
      </div>
    </div>
  );
}
