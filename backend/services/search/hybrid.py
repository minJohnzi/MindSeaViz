"""混合检索编排：并行 Whoosh (BM25) + LanceDB (向量) → RRF 融合 → Top-K。

RRF (Reciprocal Rank Fusion) 除平滑常数 k 外无需调参。
"""

from dataclasses import dataclass

from core.db.lancedb import LanceDBStore
from core.search.whoosh import WhooshIndex


@dataclass
class SearchResult:
    note_path: str
    title: str
    chunk: str
    score: float


class SearchEngine:
    """混合检索引擎：关键词 (BM25) + 语义 (向量) → RRF 融合。"""

    def __init__(self, whoosh: WhooshIndex, lancedb: LanceDBStore, rrf_k: int = 60):
        self.whoosh = whoosh
        self.lancedb = lancedb
        self.rrf_k = rrf_k

    def search(self, query: str, top_k: int = 10) -> list[SearchResult]:
        """并行执行 BM25 和向量检索，RRF 融合后返回 top_k 结果。"""
        bm25_results = self.whoosh.search(query, limit=top_k * 2)
        vec_results = self.lancedb.knn_search(query, limit=top_k * 2)
        fused = self._rrf_fusion(bm25_results, vec_results, top_k)
        return [
            SearchResult(
                note_path=r["note_path"],
                title=r.get("title", ""),
                chunk=r.get("chunk", ""),
                score=r["score"],
            )
            for r in fused
        ]

    def _rrf_fusion(self, bm25: list[dict], vec: list[dict], top_k: int) -> list[dict]:
        scores: dict[str, float] = {}
        meta: dict[str, dict] = {}
        for rank, r in enumerate(bm25):
            key = r["note_path"]
            scores[key] = scores.get(key, 0) + 1.0 / (self.rrf_k + rank + 1)
            meta[key] = r
        for rank, r in enumerate(vec):
            key = r["note_path"]
            scores[key] = scores.get(key, 0) + 1.0 / (self.rrf_k + rank + 1)
            if key not in meta:
                meta[key] = r
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return [{**meta[key], "score": score} for key, score in ranked[:top_k]]
