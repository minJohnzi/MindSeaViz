"""LanceDB 向量存储 + BGE-small-zh 嵌入模型（ONNX Runtime 推理）。

磁盘原生、嵌入式部署——无需独立服务进程。首次使用时惰性加载嵌入模型。
BGE-small-zh 输出 384 维向量，针对中英文混合语义优化。
"""

import os
from pathlib import Path

import lancedb
import numpy as np

from core.parser.splitter import Chunk

# 国内 HuggingFace 镜像，加速模型下载
HF_MIRROR = "https://hf-mirror.com"
# 本地模型缓存路径（首次从镜像下载后复用）
LOCAL_MODEL_PATH = "models/bge-small-zh"


class LanceDBStore:
    """基于 LanceDB 的向量存储，ONNX 加速 BGE-small-zh 嵌入。"""

    def __init__(self, db_dir: str | Path = "data/lancedb"):
        self.db_dir = Path(db_dir)
        self.db_dir.mkdir(parents=True, exist_ok=True)
        self._db = lancedb.connect(str(self.db_dir))
        self._table_name = "chunks"
        self._embedder: object | None = None
        self._available_cache: bool | None = None  # None=未检测, True=可用, False=不可用
        self._dim = 512  # BGE-small-zh 输出维度

    @property
    def available(self) -> bool:
        """嵌入模型是否可用（仅首次检测时尝试连接，结果缓存）。"""
        if self._available_cache is None:
            try:
                self.embedder
                self._available_cache = True
            except Exception:
                self._available_cache = False
        return self._available_cache

    @property
    def embedder(self):
        if self._embedder is False:
            return False
        if self._embedder is None:
            from pathlib import Path as _Path
            from optimum.onnxruntime import ORTModelForFeatureExtraction
            from transformers import AutoTokenizer

            # 优先本地模型，否则从国内镜像下载
            local_path = _Path(LOCAL_MODEL_PATH)
            model_id = str(local_path) if local_path.exists() else "BAAI/bge-small-zh"

            try:
                if local_path.exists():
                    self._tokenizer = AutoTokenizer.from_pretrained(
                        model_id, local_files_only=True
                    )
                    self._model = ORTModelForFeatureExtraction.from_pretrained(
                        model_id, export=True, local_files_only=True
                    )
                else:
                    os.environ.setdefault("HF_ENDPOINT", HF_MIRROR)
                    self._tokenizer = AutoTokenizer.from_pretrained(model_id)
                    self._model = ORTModelForFeatureExtraction.from_pretrained(
                        model_id, export=True
                    )
                self._embedder = True  # 标记已加载
            except Exception:
                self._embedder = False  # 标记不可用，下次不再重试
                raise
        return self._embedder

    def embed(self, texts: list[str]) -> np.ndarray:
        self.embedder
        import torch

        inputs = self._tokenizer(texts, padding=True, truncation=True, return_tensors="pt")
        with torch.no_grad():
            outputs = self._model(**inputs)
        return outputs.last_hidden_state[:, 0, :].numpy()

    def insert(self, chunks: list[Chunk]) -> None:
        if not self.available:
            return  # 嵌入模型不可用时跳过，仅保留 Whoosh 关键词索引
        texts = [c.metadata_text + c.text for c in chunks]
        vectors = self.embed(texts)
        rows = [
            {
                "vector": vectors[i].tolist(),
                "note_path": c.note_path,
                "chunk_index": c.chunk_index,
                "text": c.metadata_text + c.text,
            }
            for i, c in enumerate(chunks)
        ]
        if self._table_name in self._db.table_names():
            tbl = self._db.open_table(self._table_name)
            tbl.add(rows)
        else:
            self._db.create_table(self._table_name, rows)

    def remove_note(self, note_path: str) -> None:
        if self._table_name not in self._db.table_names():
            return
        tbl = self._db.open_table(self._table_name)
        tbl.delete(f"note_path = '{note_path}'")

    def knn_search(self, query: str, limit: int = 10) -> list[dict]:
        if self._table_name not in self._db.table_names():
            return []
        if not self.available:
            return []
        qv = self.embed([query])[0].tolist()
        tbl = self._db.open_table(self._table_name)
        results = tbl.search(qv).limit(limit).to_list()
        return [
            {
                "note_path": r["note_path"],
                "chunk": r["text"],
                "score": 1.0 - float(r.get("_distance", 0)),
            }
            for r in results
        ]
