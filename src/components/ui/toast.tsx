"use client";

/**
 * Lightweight toast: a tiny global event bus + viewport.
 * Use `toast({ title, description, variant })` from anywhere on the client.
 */

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "destructive" | "warning";
export interface ToastInput {
  id?: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}
interface Toast extends ToastInput {
  id: string;
}

const listeners = new Set<(t: Toast) => void>();

export function toast(t: ToastInput) {
  const out: Toast = {
    id: t.id ?? Math.random().toString(36).slice(2),
    title: t.title,
    description: t.description,
    variant: t.variant ?? "default",
    duration: t.duration ?? 4000,
  };
  listeners.forEach((l) => l(out));
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  React.useEffect(() => {
    const onToast = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, t.duration);
    };
    listeners.add(onToast);
    return () => {
      listeners.delete(onToast);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3 sm:bottom-4 sm:right-4 sm:top-auto sm:items-end">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-background p-3 shadow-lg",
            t.variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
            t.variant === "destructive" && "border-red-200 bg-red-50 text-red-900",
            t.variant === "warning" && "border-amber-200 bg-amber-50 text-amber-900",
          )}
          role="status"
        >
          <div className="mt-0.5">
            {t.variant === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : t.variant === "destructive" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Info className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1">
            {t.title && <p className="text-sm font-semibold">{t.title}</p>}
            {t.description && <p className="text-sm">{t.description}</p>}
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
