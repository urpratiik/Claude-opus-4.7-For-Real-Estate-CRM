import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/toast";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${APP_NAME}`, template: `%s · ${APP_NAME}` },
  description:
    "Mobile-first real estate CRM. Manage leads, instantly call new prospects, share property photos, and track your team in one place.",
  applicationName: APP_NAME,
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
