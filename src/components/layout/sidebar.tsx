"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  CalendarDays,
  Home,
  Megaphone,
  Settings,
  Users,
  UsersRound,
  BarChart3,
  Plug,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

const groups = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/leads", label: "Leads", icon: Users },
      { href: "/properties", label: "Properties", icon: Building2 },
      { href: "/followups", label: "Follow-ups", icon: Bell },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/attendance", label: "Attendance", icon: ClipboardCheck },
      { href: "/social", label: "Social Media", icon: Megaphone },
      { href: "/team", label: "Team", icon: UsersRound },
      { href: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/integrations", label: "Integrations", icon: Plug },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname() ?? "";
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r bg-background md:block">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
          E
        </div>
        <span className="font-semibold">{APP_NAME}</span>
      </div>
      <nav className="space-y-6 p-3">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {g.label}
            </p>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active =
                  pathname === it.href ||
                  (it.href !== "/dashboard" && pathname.startsWith(it.href));
                const Icon = it.icon;
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-accent font-medium text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {it.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
