import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { useChatStore } from "@/stores";
import { streamChat } from "@/api/client";

export function ChatInput() {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    sessionId,
    isStreaming,
    setIsStreaming,
    addMessage,
    setCurrentSources,
    appendStreaming,
    commitStreaming,
  } = useChatStore();

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || !sessionId) return;

    addMessage({ role: "user", content: trimmed });
    setInput("");
    setIsStreaming(true);

    streamChat(
      sessionId,
      trimmed,
      // onSources
      (sources) => setCurrentSources(sources),
      // onDelta
      (delta) => appendStreaming(delta),
      // onDone
      (_full) => {
        const srcs = useChatStore.getState().currentSources;
        commitStreaming(srcs);
      },
      // onError
      (error) => {
        appendStreaming(`\n\n[错误: ${error}]`);
        commitStreaming(undefined);
      }
    );
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, [sessionId]);

  return (
    <div className="border-t p-3 flex gap-2">
      <Input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder={isStreaming ? "AI 回复中..." : "输入问题..."}
        disabled={isStreaming}
        className="flex-1"
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={isStreaming || !input.trim()}
      >
        {isStreaming ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
