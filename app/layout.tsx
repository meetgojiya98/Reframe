import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import type { ReactNode } from "react";
import "@/app/globals.css";
import { AppToaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/session-provider";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces"
});

export const metadata: Metadata = {
  title: "Reframe — shift your thoughts, gently.",
  description: "CBT-inspired educational self-coaching app. Daily check-ins, thought records, skills, and insights.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Reframe"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#2d8a6e"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${fraunces.variable}`}>
        <SessionProvider>
          {children}
          <AppToaster />
        </SessionProvider>
      </body>
    </html>
  );
}
