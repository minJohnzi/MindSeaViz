"""聊天会话 CRUD，基于 SQLiteDB 的轻量封装。

生成 12 位十六进制 session ID。薄服务层——所有持久化委托给 SQLiteDB。
"""

import uuid
from datetime import datetime

from core.db.sqlite import SQLiteDB


class ChatSessionManager:
    """管理 SQLiteDB 之上的聊天会话 CRUD。"""

    def __init__(self, db: SQLiteDB):
        self.db = db

    def create(self, title: str = "") -> str:
        session_id = uuid.uuid4().hex[:12]
        self.db.create_session(session_id, title or f"Chat {datetime.now():%Y-%m-%d %H:%M}")
        return session_id

    def list_sessions(self) -> list[dict]:
        return self.db.list_sessions()

    def delete(self, session_id: str) -> None:
        self.db.delete_session(session_id)

    def add_message(self, session_id: str, role: str, content: str, sources: list | None = None) -> int:
        return self.db.add_message(session_id, role, content, sources)

    def get_history(self, session_id: str) -> list[dict]:
        return self.db.get_history(session_id)
