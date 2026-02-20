import "@/styles/globals.css";
import { ReactNode } from "react";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import AppHeader from "@/components/layout/app-header";
import SiteFooter from "@/components/layout/site-footer";

export const metadata: Metadata = {
  title: "HireMatrix Enterprise",
  description: "Recruitment automation platform",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-muted/40">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <AppHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
