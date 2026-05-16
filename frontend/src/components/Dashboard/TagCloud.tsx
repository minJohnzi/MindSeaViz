import { useStats } from "@/api/hooks";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TagCloud() {
  const { stats } = useStats();
  if (!stats?.tag_counts) return null;

  const maxCount = stats.tag_counts[0]?.count ?? 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">标签云</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {stats.tag_counts.slice(0, 40).map((t) => {
            const size = Math.max(0.65, t.count / maxCount);
            return (
              <Badge
                key={t.tag}
                variant="secondary"
                style={{
                  fontSize: `${(0.6 + size * 0.4).toFixed(2)}rem`,
                  opacity: 0.5 + size * 0.5,
                }}
              >
                {t.tag}
                <span className="ml-1 text-[0.6em] text-muted-foreground">
                  {t.count}
                </span>
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
