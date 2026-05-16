"""异步发布/订阅事件总线，用于系统级事件通知。

Indexer 通过它广播索引进度，WebSocket 端点通过它向前端推送事件。
也用于 watchdog 文件变更监听。
"""

import asyncio
from collections.abc import Callable, Coroutine
from enum import Enum
from pathlib import Path


class SystemEvent(str, Enum):
    INDEX_PROGRESS = "index:progress"
    INDEX_DONE = "index:done"
    VAULT_CHANGED = "vault:changed"
    SYSTEM_ERROR = "system:error"


Handler = Callable[[dict], Coroutine]


class EventBus:
    """轻量级进程内异步发布/订阅事件总线。"""

    def __init__(self):
        self._subscribers: dict[str, list[Handler]] = {}

    def subscribe(self, event: str, handler: Handler) -> None:
        self._subscribers.setdefault(event, []).append(handler)

    def unsubscribe(self, event: str, handler: Handler) -> None:
        if event in self._subscribers:
            self._subscribers[event].remove(handler)

    async def publish(self, event: str, data: dict | None = None) -> None:
        payload = data or {}
        for handler in self._subscribers.get(event, []):
            try:
                await handler(payload)
            except Exception:
                pass

    async def publish_index_progress(self, current: int, total: int) -> None:
        await self.publish(SystemEvent.INDEX_PROGRESS, {"current": current, "total": total})

    async def publish_index_done(self, count: int) -> None:
        await self.publish(SystemEvent.INDEX_DONE, {"count": count})

    async def publish_vault_changed(self, path: Path, change_type: str) -> None:
        await self.publish(
            SystemEvent.VAULT_CHANGED,
            {"path": str(path), "change_type": change_type},
        )

    async def publish_error(self, message: str) -> None:
        await self.publish(SystemEvent.SYSTEM_ERROR, {"message": message})
