import { useStats } from "@/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";

export function TagCloud() {
  const { stats } = useStats();

  return (
    <div className="rounded-2xl bg-secondary/50 border border-border/50 px-5 py-4">
      <h3 className="text-sm font-semibold mb-4">标签云</h3>
      {!stats ? (
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-5/6" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {stats.tag_counts.slice(0, 40).map((t) => {
            const maxCount = stats.tag_counts[0]?.count ?? 1;
            const size = Math.max(0.7, t.count / maxCount);
            return (
              <span
                key={t.tag}
                className="px-2.5 py-1 rounded-lg bg-background/80 text-muted-foreground hover:text-foreground transition-colors cursor-default"
                style={{
                  fontSize: `${(0.65 + size * 0.35).toFixed(2)}rem`,
                  opacity: 0.55 + size * 0.45,
                }}
              >
                {t.tag}
                <span className="ml-1 text-[0.6em] opacity-60">{t.count}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
