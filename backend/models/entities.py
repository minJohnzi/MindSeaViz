"""Dataclass 领域实体——内部数据传递对象。

区别于 models/schemas.py（Pydantic API 模型），这些是 services 和 core 层内部使用的表示。
"""

from dataclasses import dataclass, field


@dataclass
class ParsedNote:
    relative_path: str
    title: str
    content: str
    frontmatter: dict = field(default_factory=dict)
    tags: list[str] = field(default_factory=list)
    wikilinks: list[str] = field(default_factory=list)
    created: str = ""
    modified: str = ""


@dataclass
class Chunk:
    note_path: str
    note_title: str
    tags: list[str]
    section_heading: str
    text: str
    chunk_index: int
    metadata_text: str


@dataclass
class SearchResult:
    note_path: str
    title: str
    chunk: str
    score: float


@dataclass
class ChatMessage:
    role: str
    content: str
    sources: list[dict] = field(default_factory=list)


@dataclass
class GraphData:
    nodes: list[dict] = field(default_factory=list)
    edges: list[dict] = field(default_factory=list)


@dataclass
class OverviewStats:
    total_notes: int = 0
    total_tags: int = 0
    total_links: int = 0
    tag_counts: list[dict] = field(default_factory=list)
    note_type_distribution: dict[str, int] = field(default_factory=dict)
    orphan_count: int = 0


@dataclass
class InboxItem:
    path: str
    title: str
    created: str
    modified: str
    has_wikilinks: bool
    has_tags: bool
