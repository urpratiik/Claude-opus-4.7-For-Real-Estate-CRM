import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Floating Action Button (FAB) anchored above the bottom nav on mobile.
 */
export function FAB({
  href,
  onClick,
  label,
  icon,
  className,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  icon: React.ReactNode;
  className?: string;
}) {
  const cls = cn(
    "fixed bottom-20 right-4 z-30 inline-flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 active:scale-95 transition md:bottom-6",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cls} aria-label={label}>
        {icon}
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cls} aria-label={label}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
