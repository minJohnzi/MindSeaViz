"""RAG 流水线：检索 → 构建上下文 → Claude API 流式对话。

返回 sources 列表和一个 asyncio.Queue，Queue 产出 {"type": "delta"|"done"|"error"} 字典。
调用方通过 /api/chat/send 端点消费 Queue 实现 SSE 流式输出。
"""

import asyncio
import os
from dataclasses import dataclass, field
from pathlib import Path as _Path

from anthropic import AsyncAnthropic
from dotenv import load_dotenv

# 确保 .env 已加载（防御性，config.py 也会加载）
_load_root = _Path(__file__).resolve().parents[3]
load_dotenv(_load_root / ".env")

import logging
_log = logging.getLogger(__name__)
_log.info(f".env loaded from {_load_root}, key={'SET' if os.environ.get('ANTHROPIC_API_KEY') else 'MISSING'}")

from services.search.hybrid import SearchEngine, SearchResult


@dataclass
class ChatMessage:
    role: str
    content: str
    sources: list[dict] = field(default_factory=list)


class AIAgent:
    """基于 Claude 的对话代理，使用 vault RAG 上下文增强。"""

    SYSTEM_PROMPT = """\
You are MindSea assistant, a helpful AI that answers questions based on the user's markdown notes vault.
Use the provided context from the vault to ground your answers. If the context doesn't contain relevant information, say so honestly.
Always cite which notes you used when making claims."""

    def __init__(self, search_engine: SearchEngine, model: str = "claude-sonnet-4-6"):
        self.search = search_engine
        self.model = model
        self._client: AsyncAnthropic | None = None

    @property
    def client(self) -> AsyncAnthropic:
        if self._client is None:
            self._client = AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))
        return self._client

    def build_context(self, results: list[SearchResult]) -> str:
        """将检索到的 chunks 组装为上下文字符串。"""
        parts: list[str] = []
        for r in results:
            parts.append(f"[Source: {r.title}] ({r.note_path})\n{r.chunk}")
        return "\n\n---\n\n".join(parts)

    async def stream(
        self,
        query: str,
        session_history: list[ChatMessage] | None = None,
    ) -> tuple[list[dict], asyncio.Queue]:
        """检索 vault 并流式返回 Claude 回复。返回 (sources, token_queue)。"""
        results = self.search.search(query)
        sources = [
            {"note_path": r.note_path, "title": r.title, "chunk": r.chunk, "score": r.score}
            for r in results
        ]
        context = self.build_context(results)
        messages: list[dict] = [
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"}
        ]
        if session_history:
            history_messages = [
                {"role": m.role, "content": m.content} for m in session_history[-10:]
            ]
            messages = history_messages + messages

        queue: asyncio.Queue = asyncio.Queue()
        asyncio.create_task(self._stream_chat(messages, queue))
        return sources, queue

    async def _stream_chat(self, messages: list[dict], queue: asyncio.Queue) -> None:
        try:
            async with self.client.messages.stream(
                model=self.model,
                system=self.SYSTEM_PROMPT,
                messages=messages,
                max_tokens=2048,
            ) as stream:
                async for event in stream:
                    if event.type == "content_block_delta" and event.delta.type == "text_delta":
                        await queue.put({"type": "delta", "content": event.delta.text})
        except Exception as e:
            await queue.put({"type": "error", "content": str(e)})
        finally:
            await queue.put({"type": "done"})
