import { cn } from "@/lib/utils";

type MarqueeStripProps = {
  items: string[];
  className?: string;
};

export function MarqueeStrip({ items, className }: MarqueeStripProps) {
  const loopItems = [...items, ...items];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full border border-border/70 bg-card/80 py-3",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-linear-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-linear-to-l from-background to-transparent" />

      <div className="flex min-w-max animate-marquee gap-3 px-3">
        {loopItems.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
