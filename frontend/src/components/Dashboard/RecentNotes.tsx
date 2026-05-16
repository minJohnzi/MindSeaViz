import { useStats } from "@/api/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";

export function RecentNotes() {
  const { recent } = useStats();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-blue-500" />
          最近更新
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-52">
          <div className="space-y-1">
            {recent.slice(0, 20).map((r) => (
              <div
                key={r.path}
                className="text-xs px-2 py-1 rounded hover:bg-muted cursor-default flex justify-between"
                title={r.path}
              >
                <span className="font-medium truncate">{r.title}</span>
                <span className="text-muted-foreground shrink-0 ml-2">
                  {r.modified?.slice(0, 16).replace("T", " ") ?? ""}
                </span>
              </div>
            ))}
            {recent.length === 0 && (
              <p className="text-xs text-muted-foreground p-2">暂无最近更新</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
