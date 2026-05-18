import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useChatStore, type ChatMessage } from "@/stores";
import { Sparkles, User, Search } from "lucide-react";

function UserBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex justify-end mb-6 animate-fade-in">
      <div className="max-w-[75%] bg-secondary rounded-2xl rounded-br-md px-5 py-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
      </div>
    </div>
  );
}

function AssistantBubble({ msg }: { msg: ChatMessage }) {
  const hasError = msg.content.includes("[错误:") || msg.content.startsWith("Error:");

  return (
    <div className="flex gap-4 mb-8 animate-fade-in">
      <div className={cn(
        "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        hasError ? "bg-destructive-muted" : "bg-accent-muted"
      )}>
        {hasError ? (
          <span className="text-destructive text-sm font-bold">!</span>
        ) : (
          <Sparkles className="h-4 w-4 text-accent" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        {/* 引用来源 */}
        {msg.sources && msg.sources.length > 0 && (
          <details className="group">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
              <Search className="h-3 w-3" />
              参考了 {msg.sources.length} 篇笔记
            </summary>
            <div className="mt-2 space-y-1 max-h-32 overflow-auto pl-1">
              {msg.sources.slice(0, 5).map((s, i) => (
                <div
                  key={i}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-secondary/50 text-muted-foreground truncate"
                  title={s.chunk?.slice(0, 300)}
                >
                  <span className="font-medium text-foreground">{s.title || s.note_path}</span>
                  <span className="ml-1 text-muted-foreground">{(s.score || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* 正文 */}
        <div className={cn(
          "text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none",
          hasError && "text-destructive"
        )}>
          <ReactMarkdown>
            {msg.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex gap-4 mb-8">
      <div className="shrink-0 w-8 h-8 rounded-full bg-accent-muted flex items-center justify-center animate-pulse">
        <Sparkles className="h-4 w-4 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{content || "​"}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function cn(...args: (string | boolean | undefined | null)[]) {
  return args.filter(Boolean).join(" ");
}

export function ChatMessages() {
  const { messages, isStreaming, streamingContent, currentSources } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const hasContent = messages.length > 0 || isStreaming;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto px-6 py-6">
        {!hasContent && (
          <div className="flex flex-col items-center justify-center pt-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent-muted flex items-center justify-center mb-5">
              <Sparkles className="h-7 w-7 text-accent" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight mb-2">你好，有什么可以帮你？</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              基于你的笔记，我可以查找知识、总结内容、分析关联关系
            </p>
          </div>
        )}

        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <UserBubble key={i} msg={msg} />
          ) : (
            <AssistantBubble key={i} msg={msg} />
          )
        )}

        {/* 流式输出 */}
        {isStreaming && (
          <>
            {currentSources && currentSources.length > 0 && (
              <div className="pl-12 mb-2 animate-fade-in">
                <details open>
                  <summary className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    参考了 {currentSources.length} 篇笔记
                  </summary>
                  <div className="mt-1.5 space-y-0.5 max-h-28 overflow-auto">
                    {currentSources.slice(0, 6).map((s, i) => (
                      <div key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-secondary/50 text-muted-foreground truncate">
                        <span className="font-medium text-foreground">{s.title || s.note_path}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
            <StreamingBubble content={streamingContent} />
          </>
        )}

        <div ref={scrollRef} />
      </div>
    </div>
  );
}
