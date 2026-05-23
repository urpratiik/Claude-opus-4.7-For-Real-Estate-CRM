"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Bell, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import { USER_ROLES } from "@/lib/constants";

interface AppHeaderProps {
  profile: Profile;
  unreadCount: number;
  showBack?: boolean;
  title?: string;
}

export function AppHeader({ profile, unreadCount, showBack, title }: AppHeaderProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const supabase = createClient();

  const roleLabel = USER_ROLES.find((r) => r.value === profile.role)?.label ?? profile.role;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="safe-pt sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      {showBack ? (
        <Button
          size="iconSm"
          variant="ghost"
          onClick={() => router.back()}
          aria-label="Back"
          className="md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold md:hidden">
          E
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold leading-tight">
          {title ?? deriveTitle(pathname)}
        </h1>
        <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
      </div>

      <Link href="/notifications" aria-label="Notifications" className="relative">
        <Button size="iconSm" variant="ghost">
          <Bell className="h-5 w-5" />
        </Button>
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 text-[10px] leading-none"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="ml-1" aria-label="Account">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials(profile.full_name)}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="font-medium">{profile.full_name}</div>
            <div className="text-xs text-muted-foreground">{profile.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/team">Team</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

function deriveTitle(path: string) {
  if (path.startsWith("/dashboard")) return "Dashboard";
  if (path.startsWith("/leads")) return "Leads";
  if (path.startsWith("/properties")) return "Properties";
  if (path.startsWith("/followups")) return "Follow-ups";
  if (path.startsWith("/attendance")) return "Attendance";
  if (path.startsWith("/social")) return "Social Media";
  if (path.startsWith("/reports")) return "Reports";
  if (path.startsWith("/team")) return "Team";
  if (path.startsWith("/integrations")) return "Integrations";
  if (path.startsWith("/settings")) return "Settings";
  if (path.startsWith("/notifications")) return "Notifications";
  if (path.startsWith("/more")) return "More";
  return "EstateFlow";
}
