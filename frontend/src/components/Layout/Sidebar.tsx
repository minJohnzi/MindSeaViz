import { useNavStore, type View, useChatStore, useThemeStore } from "@/stores";
import { useChatSessions } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  GitGraph,
  LayoutDashboard,
  MessageSquare,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import { useState } from "react";

const navItems: { view: View; label: string; icon: React.ReactNode }[] = [
  { view: "graph", label: "知识图谱", icon: <GitGraph className="h-4 w-4" /> },
  { view: "dashboard", label: "仪表盘", icon: <LayoutDashboard className="h-4 w-4" /> },
  { view: "chat", label: "对话", icon: <MessageSquare className="h-4 w-4" /> },
  { view: "settings", label: "设置", icon: <Settings className="h-4 w-4" /> },
];

function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
    >
      {theme === "dark" ? (
        <>
          <Sun className="h-4 w-4" />
          浅色模式
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          深色模式
        </>
      )}
    </button>
  );
}

export function Sidebar() {
  const view = useNavStore((s) => s.view);
  const setView = useNavStore((s) => s.setView);
  const { sessions, createSession, selectSession } = useChatSessions();
  const sessionId = useChatStore((s) => s.sessionId);
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useThemeStore();

  const handleNewChat = async () => {
    setView("chat");
    await createSession();
  };

  if (collapsed) {
    return (
      <aside className="w-14 shrink-0 border-r border-border flex flex-col items-center py-3 gap-1 bg-secondary/50">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 mb-2"
          onClick={() => setCollapsed(false)}
        >
          <PanelLeft className="h-4 w-4 text-muted-foreground" />
        </Button>
        {navItems.map((item) => (
          <Button
            key={item.view}
            variant={view === item.view ? "secondary" : "ghost"}
            size="icon"
            className={cn(
              "h-9 w-9",
              view === item.view && "bg-accent-muted text-accent"
            )}
            onClick={() => setView(item.view)}
            title={item.label}
          >
            {item.icon}
          </Button>
        ))}
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={toggleTheme}
          title={theme === "dark" ? "浅色模式" : "深色模式"}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Moon className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </aside>
    );
  }

  return (
    <aside
      className="w-[var(--sidebar-width)] shrink-0 border-r border-border flex flex-col bg-secondary/50"
      style={{ width: "var(--sidebar-width)" }}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
          </div>
          <h1 className="text-sm font-semibold tracking-tight">MindSeaViz</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCollapsed(true)}
        >
          <PanelLeftClose className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>

      {/* 新对话按钮 */}
      <div className="px-3 pb-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 h-9 text-sm font-normal rounded-xl border-dashed"
          onClick={handleNewChat}
        >
          <Plus className="h-4 w-4" />
          新对话
        </Button>
      </div>

      {/* 导航项 */}
      <nav className="px-2 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors",
              view === item.view
                ? "bg-accent-muted text-accent font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* 分隔线 */}
      <div className="mx-3 my-3 border-t border-border" />

      {/* 对话历史 */}
      <div className="flex-1 overflow-auto px-2">
        <p className="px-3 py-1 text-[11px] font-medium text-muted-foreground tracking-wider">
          最近对话
        </p>
        <div className="space-y-0.5">
          {sessions.slice(0, 20).map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setView("chat");
                selectSession(s.id);
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 rounded-lg text-sm truncate transition-colors",
                s.id === sessionId
                  ? "bg-accent-muted text-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {s.title || s.id}
            </button>
          ))}
          {sessions.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              暂无对话记录
            </p>
          )}
        </div>
      </div>

      {/* 底部：主题切换 */}
      <div className="px-3 pb-3">
        <ThemeToggle />
      </div>
    </aside>
  );
}
