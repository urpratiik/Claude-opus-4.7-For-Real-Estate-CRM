import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/server/actions/auth";

export const metadata = { title: "Finish setup" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // If a profile already exists, send them to the app
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm text-center">
        <h1 className="text-xl font-semibold">Finish setup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You&apos;re signed in but don&apos;t belong to an organization yet. Ask your admin to
          invite you, or create a new workspace.
        </p>
        <form action={signOutAction} className="mt-4 flex flex-col gap-2">
          <a href="/signup" className="w-full">
            <Button className="w-full">Create a new workspace</Button>
          </a>
          <Button type="submit" variant="ghost" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
