import Link from "next/link";
import { ArrowRight, BarChart3, Building2, PhoneCall, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/40">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
            E
          </div>
          <span className="font-semibold">{APP_NAME}</span>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-10 text-center sm:py-16">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3 w-3" /> Built for real estate sales teams
        </div>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-5xl">
          Call every new lead in <span className="text-primary">under 30 seconds</span>.
        </h1>
        <p className="mt-3 text-balance text-base text-muted-foreground sm:text-lg">
          Capture leads from 36 Acre, MagicBricks, Housing, Facebook, Instagram and your website.
          Auto-bridge them to your sales agent the second they arrive. Share property photos in one
          tap, follow up in one tap, and track your team — all from your phone.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/signup">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/login">I have an account</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-3 px-4 pb-16 sm:grid-cols-3">
        {[
          {
            icon: PhoneCall,
            title: "Instant call bridge",
            body: "New lead arrives → we ring your agent first, then dial the lead and bridge them. Logs auto-save.",
          },
          {
            icon: Building2,
            title: "1-tap property share",
            body: "Send property photos, brochures and a public link via WhatsApp/SMS/email in one tap.",
          },
          {
            icon: BarChart3,
            title: "Built for managers",
            body: "Round-robin assignment, attendance tracking, source-wise reports, agent leaderboards.",
          },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border bg-card p-5 shadow-sm">
            <f.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-2 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}
      </footer>
    </div>
  );
}
