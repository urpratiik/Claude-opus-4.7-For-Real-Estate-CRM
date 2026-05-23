import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-1 text-2xl font-bold">Page not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        That page doesn&apos;t exist or has been moved.
      </p>
      <Button asChild className="mt-4">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
