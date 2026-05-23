import Link from "next/link";
import { LoginForm } from "./login-form";
import { APP_NAME } from "@/lib/constants";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
            E
          </div>
          <span className="text-lg font-semibold">{APP_NAME}</span>
        </div>
        <h1 className="text-center text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Sign in to your CRM workspace.
        </p>

        <div className="mt-6 rounded-xl border bg-card p-5 shadow-sm">
          <LoginForm next={params.next ?? "/dashboard"} />
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          New to EstateFlow?{" "}
          <Link href="/signup" className="font-medium text-primary">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
