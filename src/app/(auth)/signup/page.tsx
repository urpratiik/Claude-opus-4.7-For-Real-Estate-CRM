import Link from "next/link";
import { SignupForm } from "./signup-form";
import { APP_NAME } from "@/lib/constants";

export const metadata = { title: "Create your workspace" };

export default function SignupPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
            E
          </div>
          <span className="text-lg font-semibold">{APP_NAME}</span>
        </div>
        <h1 className="text-center text-2xl font-bold">Create your workspace</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Start with a free admin account. You can invite your team after.
        </p>

        <div className="mt-6 rounded-xl border bg-card p-5 shadow-sm">
          <SignupForm />
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
