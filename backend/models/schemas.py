"""Pydantic 模型——用于 API 请求/响应校验与序列化。"""

from datetime import datetime

from pydantic import BaseModel, Field


# ── Chat ──

class ChatSendRequest(BaseModel):
    session_id: str
    message: str


class ChatMessageResponse(BaseModel):
    id: int
    session_id: str
    role: str
    content: str
    sources: list[dict] | None = None
    created_at: datetime | None = None


class ChatSessionResponse(BaseModel):
    id: str
    title: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


# ── Graph ──

class GraphNode(BaseModel):
    id: str
    title: str
    tags: list[str] = Field(default_factory=list)


class GraphEdge(BaseModel):
    source: str
    target: str


class GraphResponse(BaseModel):
    nodes: list[GraphNode] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)


# ── Notes ──

class NoteResponse(BaseModel):
    path: str
    title: str
    content: str
    tags: list[str] = Field(default_factory=list)


class NoteSearchResult(BaseModel):
    note_path: str
    title: str
    chunk: str
    score: float


# ── Stats ──

class TagCount(BaseModel):
    tag: str
    count: int


class OverviewStatsResponse(BaseModel):
    total_notes: int
    total_tags: int
    total_links: int
    tag_counts: list[TagCount] = Field(default_factory=list)
    note_type_distribution: dict[str, int] = Field(default_factory=dict)
    orphan_count: int = 0


class OrphanNote(BaseModel):
    path: str
    title: str
    tags: list[str] = Field(default_factory=list)


class RecentNote(BaseModel):
    path: str
    title: str
    modified: str


class InboxItemResponse(BaseModel):
    path: str
    title: str
    created: str
    modified: str
    has_wikilinks: bool
    has_tags: bool
