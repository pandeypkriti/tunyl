"use client";
// A button that shows its own pending state inside a <form action={...}>.
// Works for both plain server-action forms and forms handed down from a
// server component as a prop, since useFormStatus just reads the nearest
// enclosing <form>.
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

export function SubmitButton({
  pendingLabel,
  children,
  disabled,
  ...props
}: ComponentProps<typeof Button> & { pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
