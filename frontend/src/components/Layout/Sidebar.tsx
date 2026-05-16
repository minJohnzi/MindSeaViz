import { useNavStore, type View } from "@/stores";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  GitGraph,
  LayoutDashboard,
  MessageSquare,
  Settings,
} from "lucide-react";

const navItems: { view: View; label: string; icon: React.ReactNode }[] = [
  { view: "graph", label: "图谱", icon: <GitGraph className="h-4 w-4" /> },
  { view: "dashboard", label: "仪表盘", icon: <LayoutDashboard className="h-4 w-4" /> },
  { view: "chat", label: "对话", icon: <MessageSquare className="h-4 w-4" /> },
  { view: "settings", label: "设置", icon: <Settings className="h-4 w-4" /> },
];

export function Sidebar() {
  const view = useNavStore((s) => s.view);
  const setView = useNavStore((s) => s.setView);

  return (
    <aside className="w-14 border-r bg-muted/30 flex flex-col items-center py-3 gap-1">
      {navItems.map((item) => (
        <Button
          key={item.view}
          variant={view === item.view ? "secondary" : "ghost"}
          size="icon"
          className={cn("h-9 w-9", view === item.view && "bg-muted")}
          onClick={() => setView(item.view)}
          title={item.label}
        >
          {item.icon}
        </Button>
      ))}
    </aside>
  );
}
