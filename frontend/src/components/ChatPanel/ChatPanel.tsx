import { useEffect } from "react";
import { useChatStore } from "@/stores";
import { useChatSessions } from "@/api/hooks";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { SessionList } from "./SessionList";

export function ChatPanel() {
  const { sessionId, setSessionId } = useChatStore();
  const { createSession } = useChatSessions();

  // 首次进入自动创建会话
  useEffect(() => {
    if (!sessionId) createSession();
  }, []);

  return (
    <div className="flex flex-col h-full border-l">
      <SessionList />
      <ChatMessages />
      <ChatInput />
    </div>
  );
}
