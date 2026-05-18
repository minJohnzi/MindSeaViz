import { useStats } from "@/api/hooks";
import { Clock } from "lucide-react";

export function RecentNotes() {
  const { recent } = useStats();

  return (
    <div className="rounded-2xl bg-secondary/50 border border-border/50 px-5 py-4">
      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
        <Clock className="h-4 w-4 text-blue-500" />
        最近更新
      </h3>
      <p className="text-xs text-muted-foreground mb-3">7 天内修改的笔记</p>
      <div className="max-h-48 overflow-auto space-y-0.5">
        {recent.slice(0, 20).map((r) => (
          <div
            key={r.path}
            className="text-xs px-2.5 py-1.5 rounded-lg hover:bg-background/80 transition-colors cursor-default flex justify-between"
          >
            <span className="font-medium truncate">{r.title}</span>
            <span className="text-muted-foreground shrink-0 ml-2">
              {r.modified?.slice(0, 16).replace("T", " ") ?? ""}
            </span>
          </div>
        ))}
        {recent.length === 0 && (
          <p className="text-xs text-muted-foreground px-2.5 py-2">暂无更新</p>
        )}
      </div>
    </div>
  );
}
