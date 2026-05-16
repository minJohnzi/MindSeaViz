"""FastAPI 依赖注入——将共享单例提供给路由处理函数。"""

from functools import lru_cache

from core.config import AppConfig, ConfigManager
from core.vault.watcher import EventBus
from core.db.sqlite import SQLiteDB
from core.db.lancedb import LanceDBStore
from core.search.whoosh import WhooshIndex
from core.parser.markdown import Parser
from core.parser.splitter import SemanticSplitter
from core.vault.reader import VaultReader
from core.indexer import Indexer

from services.graph import GraphEngine
from services.stats import StatsEngine
from services.search.hybrid import SearchEngine
from services.chat.agent import AIAgent
from services.chat.session import ChatSessionManager


# ── 配置 ──

@lru_cache()
def get_config() -> AppConfig:
    return ConfigManager().load()


# ── Core 层单例 ──

@lru_cache()
def get_event_bus() -> EventBus:
    return EventBus()


@lru_cache()
def get_sqlite() -> SQLiteDB:
    return SQLiteDB()


@lru_cache()
def get_lancedb() -> LanceDBStore:
    return LanceDBStore()


@lru_cache()
def get_whoosh() -> WhooshIndex:
    return WhooshIndex()


@lru_cache()
def get_vault_reader() -> VaultReader:
    cfg = get_config()
    reader = VaultReader(cfg.vault.path)
    reader.set_ignore_patterns(cfg.vault.ignore_patterns)
    return reader


@lru_cache()
def get_parser() -> Parser:
    return Parser()


@lru_cache()
def get_splitter() -> SemanticSplitter:
    return SemanticSplitter()


# ── Indexer（依赖多个 core 组件）──

@lru_cache()
def get_indexer() -> Indexer:
    return Indexer(
        reader=get_vault_reader(),
        parser=get_parser(),
        splitter=get_splitter(),
        whoosh=get_whoosh(),
        lancedb=get_lancedb(),
        sqlite=get_sqlite(),
        bus=get_event_bus(),
    )


# ── Service 层 ──

@lru_cache()
def get_graph_engine() -> GraphEngine:
    return GraphEngine(reader=get_vault_reader(), parser=get_parser())


@lru_cache()
def get_stats_engine() -> StatsEngine:
    return StatsEngine(reader=get_vault_reader(), parser=get_parser())


@lru_cache()
def get_search_engine() -> SearchEngine:
    cfg = get_config()
    return SearchEngine(
        whoosh=get_whoosh(),
        lancedb=get_lancedb(),
        rrf_k=cfg.search.hybrid.rrf_k,
    )


@lru_cache()
def get_ai_agent() -> AIAgent:
    cfg = get_config()
    return AIAgent(search_engine=get_search_engine(), model=cfg.ai.model)


@lru_cache()
def get_session_manager() -> ChatSessionManager:
    return ChatSessionManager(db=get_sqlite())
