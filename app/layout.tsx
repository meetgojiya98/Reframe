import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import type { HTMLAttributes, ReactNode } from "react";
import "@/app/globals.css";
import { DynamicBackground } from "@/components/dynamic-background";
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
  themeColor: "#2a7a5e"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      {...({ suppressHydrationMismatch: true } as HTMLAttributes<HTMLHtmlElement>)}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("reframe_theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark");else document.documentElement.classList.remove("dark");})();`
          }}
        />
      </head>
      <body className={`${manrope.variable} ${fraunces.variable}`}>
        <DynamicBackground />
        <div className="relative z-10 min-h-screen bg-transparent">
          <SessionProvider>
            {children}
            <AppToaster />
          </SessionProvider>
        </div>
      </body>
    </html>
  );
}
