import { useStats } from "@/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Tag, Link2, AlertTriangle } from "lucide-react";

const cards = [
  { key: "total_notes" as const, label: "笔记总数", icon: FileText, color: "#6366f1" },
  { key: "total_tags" as const, label: "标签数", icon: Tag, color: "#10b981" },
  { key: "total_links" as const, label: "链接数", icon: Link2, color: "#8b5cf6" },
  { key: "orphan_count" as const, label: "孤岛笔记", icon: AlertTriangle, color: "#f59e0b" },
];

export function StatsCards() {
  const { stats } = useStats();

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map(({ key, label, icon: Icon, color }) => (
        <div
          key={key}
          className="rounded-2xl bg-secondary/50 border border-border/50 px-5 py-4 hover:bg-secondary/80 transition-colors"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: color + "18" }}
            >
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <span className="text-sm text-muted-foreground font-medium">{label}</span>
          </div>
          {stats ? (
            <div className="text-3xl font-bold tracking-tight">{stats[key]}</div>
          ) : (
            <Skeleton className="h-9 w-16" />
          )}
        </div>
      ))}
    </div>
  );
}
