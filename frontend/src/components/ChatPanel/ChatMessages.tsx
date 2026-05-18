import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useChatStore, type ChatMessage } from "@/stores";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function UserBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex justify-end mb-3">
      <div className="max-w-[80%] bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm">
        <p className="whitespace-pre-wrap">{msg.content}</p>
      </div>
    </div>
  );
}

function AssistantBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex flex-col mb-3">
      {/* 引用来源 */}
      {msg.sources && msg.sources.length > 0 && (
        <details className="mb-1.5">
          <summary className="text-[10px] text-muted-foreground cursor-pointer">
            引用了 {msg.sources.length} 篇笔记
          </summary>
          <div className="mt-1 space-y-0.5">
            {msg.sources.slice(0, 5).map((s, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-[9px] block text-left truncate max-w-full"
                title={s.chunk?.slice(0, 200)}
              >
                {s.title || s.note_path} ({(s.score || 0).toFixed(2)})
              </Badge>
            ))}
          </div>
        </details>
      )}
      <div className="max-w-[85%] bg-muted rounded-lg px-3 py-2 text-sm prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{msg.content}</ReactMarkdown>
      </div>
    </div>
  );
}

function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex flex-col mb-3">
      <div className="max-w-[85%] bg-muted rounded-lg px-3 py-2 text-sm prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{content || "..."}</ReactMarkdown>
      </div>
    </div>
  );
}

export function ChatMessages() {
  const { messages, isStreaming, streamingContent, currentSources } =
    useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-1 min-h-full">
        {messages.length === 0 && !isStreaming && (
          <p className="text-sm text-muted-foreground text-center mt-8">
            问点关于你笔记的问题
          </p>
        )}

        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <UserBubble key={i} msg={msg} />
          ) : (
            <AssistantBubble key={i} msg={msg} />
          )
        )}

        {/* 流式内容 */}
        {isStreaming && (
          <>
            {currentSources && currentSources.length > 0 && (
              <div className="mb-1.5">
                <details open>
                  <summary className="text-[10px] text-muted-foreground cursor-pointer">
                    引用了 {currentSources.length} 篇笔记
                  </summary>
                  <div className="mt-1 space-y-0.5 max-h-32 overflow-auto">
                    {currentSources.slice(0, 8).map((s, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-[9px] block text-left truncate"
                        title={s.chunk?.slice(0, 200)}
                      >
                        {s.title || s.note_path}
                      </Badge>
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
    </ScrollArea>
  );
}
