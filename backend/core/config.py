"""基于 Pydantic 的 config.yaml 配置加载器。

ConfigManager 是所有运行时配置的唯一数据源。
首次 load() 时若 config.yaml 缺失，自动写入默认配置。
"""

from pathlib import Path

import yaml
from pydantic import BaseModel


class VaultConfig(BaseModel):
    path: str = "E:/MindSea"
    ignore_patterns: list[str] = [".git", ".obsidian", "_templates"]


class ServerConfig(BaseModel):
    host: str = "127.0.0.1"
    port: int = 8000


class AIConfig(BaseModel):
    provider: str = "anthropic"
    model: str = "claude-sonnet-4-6"
    api_key_env: str = "ANTHROPIC_API_KEY"


class EmbeddingConfig(BaseModel):
    model: str = "BAAI/bge-small-zh"
    device: str = "cpu"
    onnx: bool = True


class HybridSearchConfig(BaseModel):
    algorithm: str = "rrf"
    rrf_k: int = 60


class SearchConfig(BaseModel):
    hybrid: HybridSearchConfig = HybridSearchConfig()
    top_k: int = 10


class IndexConfig(BaseModel):
    auto_index: bool = True
    debounce_ms: int = 2000


class AppConfig(BaseModel):
    vault: VaultConfig = VaultConfig()
    server: ServerConfig = ServerConfig()
    ai: AIConfig = AIConfig()
    embedding: EmbeddingConfig = EmbeddingConfig()
    search: SearchConfig = SearchConfig()
    index: IndexConfig = IndexConfig()


class ConfigManager:
    """加载、验证并保存 config.yaml。"""

    def __init__(self, config_path: str | Path = "config.yaml"):
        self.config_path = Path(config_path)
        self._config: AppConfig | None = None

    def load(self) -> AppConfig:
        if not self.config_path.exists():
            self._config = AppConfig()
            self.save()
            return self._config
        data = yaml.safe_load(self.config_path.read_text(encoding="utf-8")) or {}
        self._config = AppConfig(**data)
        return self._config

    def save(self) -> None:
        self.config_path.write_text(
            yaml.dump(self.config.model_dump(), allow_unicode=True, default_flow_style=False),
            encoding="utf-8",
        )

    @property
    def config(self) -> AppConfig:
        if self._config is None:
            self.load()
        return self._config  # type: ignore[return-value]
