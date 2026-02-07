import type { ReactNode } from "react";
import Link from "next/link";
import { ReframeLogo } from "@/components/reframe-logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen min-h-dvh flex-col items-center justify-center overflow-x-hidden bg-background px-4 py-6 [padding-bottom:env(safe-area-inset-bottom)] [padding-top:env(safe-area-inset-top)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(72, 187, 120, 0.2), transparent 50%)"
        }}
      />
      <div className="relative flex w-full flex-col items-center gap-8">
        <Link href="/" className="focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 rounded-xl">
          <ReframeLogo variant="full" size="md" className="text-foreground" />
        </Link>
        {children}
      </div>
    </div>
  );
}
