"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction, type ActionResult } from "@/server/actions/auth";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    signupAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="organization_name">Company / team name</Label>
        <Input
          id="organization_name"
          name="organization_name"
          placeholder="Acme Realty"
          required
          minLength={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Your name</Label>
        <Input id="full_name" name="full_name" placeholder="Jane Doe" required minLength={2} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>

      {state && !state.ok && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? "Creating workspace..." : "Create workspace"}
      </Button>
    </form>
  );
}
