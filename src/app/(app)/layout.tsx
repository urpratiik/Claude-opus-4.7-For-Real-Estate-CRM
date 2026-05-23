import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null)
    .eq("user_id", profile.id);

  return (
    <div className="flex min-h-dvh bg-muted/30">
      <Sidebar />
      <div className="flex min-h-dvh flex-1 flex-col">
        <AppHeader profile={profile} unreadCount={count ?? 0} />
        {children}
        <BottomNav />
      </div>
    </div>
  );
}
