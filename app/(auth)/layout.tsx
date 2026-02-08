import type { ReactNode } from "react";
import Link from "next/link";
import { ReframeLogo } from "@/components/reframe-logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen min-h-dvh flex-col items-center justify-center overflow-x-hidden bg-background px-4 py-8 [padding-bottom:env(safe-area-inset-bottom)] [padding-top:env(safe-area-inset-top)]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 100% 60% at 50% -20%, rgba(45, 138, 110, 0.06) 0%, transparent 50%)"
        }}
      />
      <div className="relative flex w-full max-w-md flex-col items-center gap-10">
        <Link
          href="/"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
        >
          <ReframeLogo variant="full" size="md" className="text-foreground" />
        </Link>
        {children}
      </div>
    </div>
  );
}
