import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
// Note: Geist fonts from the 'geist' package are already optimized. 
// If preloads are unused, it might be due to late discovery in complex CSS.
// We'll ensure they are applied cleanly.
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "@/stack";

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export const metadata: Metadata = {
  title: {
    default: "Time Work | Enterprise Protocol Management",
    template: "%s | Time Work",
  },
  description: "Time Work is the enterprise-standard project management platform built for protocol-driven workflows.",
  keywords: ["Project Management", "Protocol", "Enterprise", "SaaS", "Workflow", "Productivity", "Time Work"],
  authors: [{ name: "Time Work Team" }],
  creator: "Time Work",
  metadataBase: new URL("https://timework.crediblemark.com"), // Updated to new general domain
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://timework.crediblemark.com",
    siteName: "Time Work",
    title: "Time Work | Enterprise Protocol Management",
    description: "Enterprise-standard project management for protocol-driven workflows.",
    images: [
      {
        url: "/timework-og.png",
        width: 1200,
        height: 630,
        alt: "Time Work Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Time Work | Enterprise Protocol Management",
    description: "Enterprise-standard project management for protocol-driven workflows.",
    creator: "@timework",
    images: ["/timework-og.png"],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
    shortcut: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Time Work",
  },
  formatDetection: {
    telephone: false,
  },
};

import { TooltipProvider } from "@radix-ui/react-tooltip";
import { OnboardingCheckWrapper } from "@/components/auth/OnboardingCheckWrapper";
import { Toaster } from "sonner";

import { getCurrentUser } from "@/actions/auth";
import { getDictionary, getLocale } from '@/i18n/server';
import { Suspense } from "react";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dict = await getDictionary();
  const currentUser = await getCurrentUser();
  const locale = await getLocale();

  // File Manager Visibility Logic
  let canSeeFileManager = false;
  if (currentUser) {
    const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';
    const isManager = currentUser.role === 'MANAGER';
    if (isAdmin || isManager) {
      canSeeFileManager = true;
    } else if (currentUser.organizationId) {
      const { prisma } = await import('@/lib/db');
      const count = await prisma.projectItem.count({
        where: {
          project: {
            organizationId: currentUser.organizationId,
            deletedAt: null
          },
          requireAttachment: true,
          OR: [
            { assignedToId: currentUser.id },
            { assignees: { some: { id: currentUser.id } } },
            { allowedFileViewers: { some: { id: currentUser.id } } }
          ]
        }
      });
      canSeeFileManager = count > 0;
    }
  }

  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StackProvider app={stackServerApp}>
            <StackTheme theme={{
              light: {
                primary: '#4f46e5', // Indigo
                foreground: '#0f172a', // slate-900
                background: '#f8fafc', // slate-50
                card: '#ffffff',
                cardForeground: '#0f172a',
                muted: '#f1f5f9',
                mutedForeground: '#64748b',
              },
              dark: {
                primary: '#4f46e5', // Indigo
                foreground: '#ffffff', // Pure White
                background: '#0f172a',
                card: '#0f172a',
                cardForeground: '#ffffff', // Pure White
                muted: '#1e293b',
                mutedForeground: '#ffffff', // Pure White (Force visibility)
                popover: '#0f172a',
                popoverForeground: '#ffffff', // Pure White
                secondary: '#1e293b',
                secondaryForeground: '#ffffff', // Pure White
                accent: '#1e293b',
                accentForeground: '#ffffff', // Pure White
                destructive: '#ef4444',
                destructiveForeground: '#ffffff',
                border: '#1e293b',
                input: '#1e293b',
                ring: '#4f46e5', // Indigo
              },
              radius: '0.75rem',
            }}>
              <TooltipProvider>
                <OnboardingCheckWrapper />
                <Suspense fallback={null}>
                  <Navbar
                    dict={dict}
                    locale={locale}
                    signInUrl={stackServerApp.urls.signIn}
                    currentUser={currentUser}
                    canSeeFileManager={canSeeFileManager}
                  />
                </Suspense>
                <main className="min-h-screen">
                  {children}
                </main>
                <Toaster />
                <InstallPrompt />
                <ServiceWorkerRegister />
              </TooltipProvider>
            </StackTheme>
          </StackProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
