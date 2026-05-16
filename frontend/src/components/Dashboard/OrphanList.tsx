import { useStats } from "@/api/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle } from "lucide-react";

export function OrphanList() {
  const { orphans } = useStats();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          孤岛笔记
          <span className="text-muted-foreground font-normal">
            ({orphans.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-52">
          <div className="space-y-1">
            {orphans.map((o) => (
              <div
                key={o.path}
                className="text-xs px-2 py-1 rounded hover:bg-muted cursor-default"
                title={o.path}
              >
                <span className="font-medium">{o.title}</span>
                {o.tags.length > 0 && (
                  <span className="text-muted-foreground ml-1">
                    {o.tags.slice(0, 3).join(", ")}
                  </span>
                )}
              </div>
            ))}
            {orphans.length === 0 && (
              <p className="text-xs text-muted-foreground p-2">暂无孤岛笔记</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
