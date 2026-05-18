import { useChatSessions } from "@/api/hooks";
import { useChatStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function SessionList() {
  const { sessions, sessionId, createSession, selectSession } = useChatSessions();

  return (
    <div className="border-b p-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">会话</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => createSession()}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="space-y-0.5 max-h-32 overflow-auto">
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => selectSession(s.id)}
            className={cn(
              "w-full text-left text-xs px-2 py-1 rounded hover:bg-muted flex items-center gap-1.5",
              s.id === sessionId && "bg-muted font-medium"
            )}
          >
            <MessageSquare className="h-3 w-3 shrink-0" />
            <span className="truncate">{s.title || s.id}</span>
          </button>
        ))}
        {sessions.length === 0 && (
          <p className="text-[10px] text-muted-foreground px-2 py-1">
            点击 + 新建会话
          </p>
        )}
      </div>
    </div>
  );
}
