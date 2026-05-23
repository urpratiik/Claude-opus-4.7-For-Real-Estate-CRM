"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LEAD_SOURCES,
  PROPERTY_TYPES,
  LEAD_TEMPERATURES,
} from "@/lib/constants";
import { createLeadAction, type ActionResult } from "@/server/actions/leads";

export function LeadCreateForm({ agents }: { agents: { id: string; full_name: string }[] }) {
  const [state, action, pending] = useActionState<ActionResult<{ id: string }> | null, FormData>(
    createLeadAction,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" required>
          <Input name="full_name" required minLength={2} placeholder="Rahul Sharma" />
        </Field>
        <Field label="Phone (E.164)" required>
          <Input
            name="phone"
            required
            placeholder="+919999999999"
            pattern="^\+[1-9]\d{6,14}$"
            inputMode="tel"
          />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" placeholder="rahul@example.com" />
        </Field>
        <Field label="Source">
          <Select name="source" defaultValue="manual">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_SOURCES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Property type">
          <Select name="property_type">
            <SelectTrigger>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Temperature">
          <Select name="temperature" defaultValue="warm">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_TEMPERATURES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Budget min (₹)">
          <Input name="budget_min" type="number" min={0} step={100000} inputMode="numeric" />
        </Field>
        <Field label="Budget max (₹)">
          <Input name="budget_max" type="number" min={0} step={100000} inputMode="numeric" />
        </Field>
        <Field label="Preferred location" className="sm:col-span-2">
          <Input name="preferred_location" placeholder="Gurgaon Sector 54" />
        </Field>
        <Field label="Assign to agent" className="sm:col-span-2">
          <Select name="assigned_agent_id">
            <SelectTrigger>
              <SelectValue placeholder="Auto-assign (round robin)" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea name="notes" rows={4} placeholder="Anything important?" />
        </Field>
      </div>

      {state && !state.ok && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="sticky bottom-20 z-10 flex gap-2 bg-background pt-2 md:bottom-auto md:static">
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Saving..." : "Save lead"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
