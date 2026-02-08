import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  badge,
  className
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  className?: string;
}) {
  return (
    <header className={cn("space-y-2", className)}>
      {badge ? (
        <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
          {badge}
        </span>
      ) : null}
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
      {subtitle ? <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{subtitle}</p> : null}
    </header>
  );
}
