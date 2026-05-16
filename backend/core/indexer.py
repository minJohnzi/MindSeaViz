"""编排完整索引流程：读取 → 解析 → 拆分 → 索引（Whoosh + LanceDB）。

支持 full_scan（冷启动全量）和 index_file（单文件增量更新）。
通过与 SQLite 中存储的 MD5 哈希比对跳过未修改的文件。
"""

import hashlib
from pathlib import Path

from .db.lancedb import LanceDBStore
from .db.sqlite import SQLiteDB
from .parser.markdown import Parser
from .parser.splitter import SemanticSplitter
from .search.whoosh import WhooshIndex
from .vault.reader import VaultReader
from .vault.watcher import EventBus


class Indexer:
    """将 core 层各模块串联为索引流水线。

    full_scan → vault 冷启动全量索引。
    index_file → 单文件变更时增量更新。
    """

    def __init__(
        self,
        reader: VaultReader,
        parser: Parser,
        splitter: SemanticSplitter,
        whoosh: WhooshIndex,
        lancedb: LanceDBStore,
        sqlite: SQLiteDB,
        bus: EventBus,
    ):
        self.reader = reader
        self.parser = parser
        self.splitter = splitter
        self.whoosh = whoosh
        self.lancedb = lancedb
        self.sqlite = sqlite
        self.bus = bus

    def _file_hash(self, content: str) -> str:
        return hashlib.md5(content.encode()).hexdigest()

    async def full_scan(self) -> int:
        """全量索引整个 vault。跳过哈希未变的文件。"""
        files = self.reader.list_files()
        total = len(files)
        indexed = 0
        for i, path in enumerate(files):
            await self.bus.publish_index_progress(i + 1, total)
            content = self.reader.read(path)
            fhash = self._file_hash(content)
            meta = self.sqlite.get_index_meta(str(path))
            if meta and meta["file_hash"] == fhash:
                continue
            note = self.parser.parse(path, content)
            chunks = self.splitter.split(note)
            self.whoosh.index_chunks(chunks)
            self.lancedb.insert(chunks)
            self.sqlite.set_index_meta(str(path), fhash, len(chunks))
            indexed += 1
        await self.bus.publish_index_done(indexed)
        return indexed

    async def index_file(self, relative_path: Path) -> None:
        """索引或重新索引单个文件。先移除旧条目再写入新数据。"""
        content = self.reader.read(relative_path)
        fhash = self._file_hash(content)
        note = self.parser.parse(relative_path, content)
        self.whoosh.remove_note(str(relative_path))
        self.lancedb.remove_note(str(relative_path))
        chunks = self.splitter.split(note)
        self.whoosh.index_chunks(chunks)
        self.lancedb.insert(chunks)
        self.sqlite.set_index_meta(str(relative_path), fhash, len(chunks))
