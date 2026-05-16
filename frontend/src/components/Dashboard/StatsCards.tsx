import { useStats } from "@/api/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Tag, Link2, AlertTriangle } from "lucide-react";

const cards = [
  { key: "total_notes" as const, label: "笔记总数", icon: FileText, color: "text-blue-500" },
  { key: "total_tags" as const, label: "标签数", icon: Tag, color: "text-green-500" },
  { key: "total_links" as const, label: "链接数", icon: Link2, color: "text-purple-500" },
  { key: "orphan_count" as const, label: "孤岛笔记", icon: AlertTriangle, color: "text-amber-500" },
];

export function StatsCards() {
  const { stats } = useStats();

  if (!stats) return null;

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map(({ key, label, icon: Icon, color }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
            <Icon className={`h-4 w-4 ${color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[key]}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
