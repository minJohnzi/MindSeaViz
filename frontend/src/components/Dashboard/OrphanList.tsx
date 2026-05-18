import { useStats } from "@/api/hooks";
import { AlertTriangle } from "lucide-react";

export function OrphanList() {
  const { orphans } = useStats();

  return (
    <div className="rounded-2xl bg-secondary/50 border border-border/50 px-5 py-4">
      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        孤岛笔记
        <span className="text-muted-foreground font-normal text-xs">
          {orphans.length}
        </span>
      </h3>
      <p className="text-xs text-muted-foreground mb-3">没有任何 wikilinks 的笔记</p>
      <div className="max-h-48 overflow-auto space-y-0.5">
        {orphans.map((o) => (
          <div
            key={o.path}
            className="text-xs px-2.5 py-1.5 rounded-lg hover:bg-background/80 transition-colors cursor-default truncate"
            title={o.path}
          >
            <span className="font-medium">{o.title}</span>
            {o.tags.length > 0 && (
              <span className="text-muted-foreground ml-1.5">
                {o.tags.slice(0, 3).join(", ")}
              </span>
            )}
          </div>
        ))}
        {orphans.length === 0 && (
          <p className="text-xs text-muted-foreground px-2.5 py-2">暂无孤岛笔记</p>
        )}
      </div>
    </div>
  );
}
