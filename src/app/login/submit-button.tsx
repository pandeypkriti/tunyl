"use client";
// Tiny client wrapper so the submit button can show a pending state while the
// server action runs. The action itself stays in page.tsx, untouched.
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}
