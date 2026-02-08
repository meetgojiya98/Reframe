import Link from "next/link";
import { Home, FileQuestion, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileQuestion className="h-10 w-10" aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          This page doesn&apos;t exist or may have been moved. Head back to the app or home to continue.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="default" className="rounded-xl">
          <Link href="/today">
            <Sparkles className="mr-2 h-4 w-4" />
            Open Today
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Go home
          </Link>
        </Button>
      </div>
    </div>
  );
}
