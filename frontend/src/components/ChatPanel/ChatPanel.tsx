import { useEffect } from "react";
import { useChatStore } from "@/stores";
import { useChatSessions } from "@/api/hooks";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { GraphOverlay } from "./GraphOverlay";

export function ChatPanel() {
  const { sessionId } = useChatStore();
  const { createSession } = useChatSessions();

  useEffect(() => {
    if (!sessionId) createSession();
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <ChatMessages />
      <ChatInput />
    </div>
  );
}
