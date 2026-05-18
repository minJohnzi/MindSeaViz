const BASE = "http://127.0.0.1:8001";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ── SSE 流式聊天 ──

export function streamChat(
  sessionId: string,
  message: string,
  onSources: (sources: Array<{ note_path: string; title: string; chunk: string; score: number }>) => void,
  onDelta: (delta: string) => void,
  onDone: (fullContent: string) => void,
  onError: (error: string) => void
): AbortController {
  const controller = new AbortController();

  fetch(`${BASE}/api/chat/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
    signal: controller.signal,
  }).then(async (res) => {
    if (!res.ok) {
      onError(`HTTP ${res.status}`);
      return;
    }
    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let buf = "";
    let currentEvent = "";
    let full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (currentEvent === "sources") {
              onSources(data);
            } else if (currentEvent === "message" || !currentEvent) {
              const delta = data.delta || "";
              full += delta;
              onDelta(delta);
            } else if (currentEvent === "done") {
              onDone(full);
              return;
            } else if (currentEvent === "error") {
              onError(data.message || "Unknown error");
              return;
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    }
    onDone(full);
  }).catch((e) => {
    if (e.name !== "AbortError") onError(e.message);
  });

  return controller;
}
