"""Whoosh BM25 关键词倒排索引，用于全文检索。

提供精确/部分关键词快速匹配。与 LanceDB 向量检索通过 RRF 融合。
"""

from pathlib import Path

from whoosh import index
from whoosh.analysis import StandardAnalyzer
from whoosh.fields import ID, TEXT, Schema
from whoosh.qparser import MultifieldParser

from core.parser.splitter import Chunk


class WhooshIndex:
    """基于 Whoosh 的 BM25 关键词检索引擎。"""

    SCHEMA = Schema(
        chunk_id=ID(stored=True, unique=True),
        note_path=ID(stored=True),
        title=TEXT(stored=True),
        content=TEXT(stored=True, analyzer=StandardAnalyzer()),
        metadata_text=TEXT(stored=True),
    )

    def __init__(self, index_dir: str | Path = "data/whoosh_index"):
        self.index_dir = Path(index_dir)
        self.index_dir.mkdir(parents=True, exist_ok=True)
        self._ix: index.Index | None = None

    @property
    def ix(self) -> index.Index:
        if self._ix is None:
            if index.exists_in(str(self.index_dir)):
                self._ix = index.open_dir(str(self.index_dir))
            else:
                self._ix = index.create_in(str(self.index_dir), self.SCHEMA)
        return self._ix

    def index_chunks(self, chunks: list[Chunk]) -> None:
        writer = self.ix.writer()
        for c in chunks:
            chunk_id = f"{c.note_path}::{c.chunk_index}"
            writer.update_document(
                chunk_id=chunk_id,
                note_path=c.note_path,
                title=c.note_title,
                content=c.text,
                metadata_text=c.metadata_text,
            )
        writer.commit()

    def remove_note(self, note_path: str) -> None:
        writer = self.ix.writer()
        writer.delete_by_term("note_path", note_path)
        writer.commit()

    def search(self, query: str, limit: int = 10) -> list[dict]:
        qp = MultifieldParser(["title", "content", "metadata_text"], schema=self.SCHEMA)
        q = qp.parse(query)
        with self.ix.searcher() as searcher:
            results = searcher.search(q, limit=limit)
            return [
                {
                    "note_path": r["note_path"],
                    "title": r["title"],
                    "chunk": r["content"],
                    "score": r.score,
                }
                for r in results
            ]
