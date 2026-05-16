"""SQLite 持久化：聊天会话、消息、系统状态、索引元数据。

首次访问时惰性连接，建表语句 SCHEMA_SQL 在连接时自动执行。
"""

import json
import sqlite3
from datetime import datetime
from pathlib import Path


class SQLiteDB:
    """sqlite3 轻量封装，提供 MindSeaViz schema 的类型化读写方法。"""

    SCHEMA_SQL = """
    CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        title TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT REFERENCES chat_sessions(id),
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        sources JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_state (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS index_metadata (
        note_path TEXT PRIMARY KEY,
        file_hash TEXT,
        chunk_count INTEGER,
        last_indexed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """

    def __init__(self, db_path: str | Path = "data/mindsea.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._conn: sqlite3.Connection | None = None

    @property
    def conn(self) -> sqlite3.Connection:
        if self._conn is None:
            self._conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
            self._conn.row_factory = sqlite3.Row
            self._conn.executescript(self.SCHEMA_SQL)
            self._conn.commit()
        return self._conn

    # ── 聊天会话 ──

    def create_session(self, session_id: str, title: str = "") -> None:
        self.conn.execute(
            "INSERT INTO chat_sessions (id, title) VALUES (?, ?)", (session_id, title)
        )
        self.conn.commit()

    def list_sessions(self) -> list[dict]:
        rows = self.conn.execute(
            "SELECT * FROM chat_sessions ORDER BY updated_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]

    def delete_session(self, session_id: str) -> None:
        self.conn.execute("DELETE FROM chat_messages WHERE session_id = ?", (session_id,))
        self.conn.execute("DELETE FROM chat_sessions WHERE id = ?", (session_id,))
        self.conn.commit()

    # ── 聊天消息 ──

    def add_message(self, session_id: str, role: str, content: str, sources: list | None = None) -> int:
        cursor = self.conn.execute(
            "INSERT INTO chat_messages (session_id, role, content, sources) VALUES (?, ?, ?, ?)",
            (session_id, role, content, json.dumps(sources or [])),
        )
        self.conn.execute(
            "UPDATE chat_sessions SET updated_at = ? WHERE id = ?",
            (datetime.now(), session_id),
        )
        self.conn.commit()
        return cursor.lastrowid

    def get_history(self, session_id: str) -> list[dict]:
        rows = self.conn.execute(
            "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at",
            (session_id,),
        ).fetchall()
        return [dict(r) for r in rows]

    # ── 系统状态 ──

    def set_state(self, key: str, value: str) -> None:
        self.conn.execute(
            "INSERT OR REPLACE INTO system_state (key, value, updated_at) VALUES (?, ?, ?)",
            (key, value, datetime.now()),
        )
        self.conn.commit()

    def get_state(self, key: str) -> str | None:
        row = self.conn.execute(
            "SELECT value FROM system_state WHERE key = ?", (key,)
        ).fetchone()
        return row["value"] if row else None

    # ── 索引元数据 ──

    def set_index_meta(self, note_path: str, file_hash: str, chunk_count: int) -> None:
        self.conn.execute(
            "INSERT OR REPLACE INTO index_metadata (note_path, file_hash, chunk_count, last_indexed)"
            " VALUES (?, ?, ?, ?)",
            (note_path, file_hash, chunk_count, datetime.now()),
        )
        self.conn.commit()

    def get_index_meta(self, note_path: str) -> dict | None:
        row = self.conn.execute(
            "SELECT * FROM index_metadata WHERE note_path = ?", (note_path,)
        ).fetchone()
        return dict(row) if row else None

    def close(self) -> None:
        if self._conn:
            self._conn.close()
            self._conn = None
