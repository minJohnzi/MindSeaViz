import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/stores";
import { streamChat } from "@/api/client";
import { ArrowUp, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "我的笔记里有哪些关于机器学习的知识？",
  "最近更新了哪些笔记？",
  "帮我总结知识图谱的结构",
];

export function ChatInput() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    sessionId,
    isStreaming,
    setIsStreaming,
    addMessage,
    setCurrentSources,
    appendStreaming,
    commitStreaming,
    messages,
  } = useChatStore();

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || !sessionId) return;
    addMessage({ role: "user", content: trimmed });
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsStreaming(true);

    streamChat(
      sessionId,
      trimmed,
      (sources) => setCurrentSources(sources),
      (delta) => appendStreaming(delta),
      (_full) => {
        const srcs = useChatStore.getState().currentSources;
        commitStreaming(srcs);
      },
      (error) => {
        appendStreaming(`\n\n${error}`);
        commitStreaming(undefined);
      }
    );
  };

  // auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showSuggestions = messages.length === 0 && !isStreaming;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-4">
      {/* 建议 chips */}
      {showSuggestions && (
        <div className="flex flex-wrap justify-center gap-2 mb-3 animate-fade-in">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-accent/30 hover:bg-accent-muted transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* 输入区域 - 毛玻璃 pill */}
      <div className="relative">
        <div className="glass rounded-[2rem] border border-border shadow-md flex items-end gap-2 px-4 py-2.5">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="基于你的笔记提问..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-transparent border-0 outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground py-1 max-h-40"
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center disabled:opacity-30 hover:bg-accent-hover transition-colors"
          >
            {isStreaming ? (
              <Sparkles className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <p className="text-[10px] text-center mt-2 text-muted-foreground">
        MindSeaViz 基于你的笔记回答，可能不总是准确的
      </p>
    </div>
  );
}
