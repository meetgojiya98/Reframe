import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  className
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <header className={cn("space-y-1.5", className)}>
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
      {subtitle ? <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{subtitle}</p> : null}
    </header>
  );
}
