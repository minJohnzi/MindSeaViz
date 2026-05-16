"""按标题边界将笔记拆分为可嵌入的 chunks。

规则：<500 字符 → 1 chunk。>500 字符 → 按 ##/### 标题拆分。
每个 chunk 注入元数据（标题、tags、所在章节）。
"""

import re
from dataclasses import dataclass

from .markdown import ParsedNote


@dataclass
class Chunk:
    note_path: str
    note_title: str
    tags: list[str]
    section_heading: str
    text: str
    chunk_index: int
    metadata_text: str  # 嵌入检索时前置注入的元数据文本


class SemanticSplitter:
    """按语义边界（标题）拆分笔记，并注入元数据。"""

    MAX_CHARS = 500
    HEADING_RE = re.compile(r"^(#{2,3})\s+(.+)$", re.MULTILINE)

    def split(self, note: ParsedNote) -> list[Chunk]:
        if len(note.content) <= self.MAX_CHARS:
            return [self._make_chunk(note, note.content, "", 0)]
        return self._split_by_headings(note)

    def _split_by_headings(self, note: ParsedNote) -> list[Chunk]:
        chunks: list[Chunk] = []
        sections = self.HEADING_RE.split(note.content)
        current_heading = ""
        current_text = ""

        for i, part in enumerate(sections):
            if re.match(r"^(#{2,3})\s+(.+)$", part) if i % 3 == 1 else False:
                if current_text.strip():
                    chunks.append(self._make_chunk(note, current_text.strip(), current_heading, len(chunks)))
                current_heading = part
                current_text = ""
            elif i % 3 == 2:  # 标题文本 — 已被上方匹配消费
                pass
            else:
                current_text += part

        if current_text.strip():
            chunks.append(self._make_chunk(note, current_text.strip(), current_heading, len(chunks)))

        return chunks or [self._make_chunk(note, note.content, "", 0)]

    def _make_chunk(self, note: ParsedNote, text: str, heading: str, idx: int) -> Chunk:
        # 元数据注入：防止检索时 chunk 脱离上下文
        meta = f"[Note: {note.title}] [Tags: {', '.join(note.tags)}] "
        if heading:
            meta += f"[Section: {heading}] "
        return Chunk(
            note_path=str(note.relative_path),
            note_title=note.title,
            tags=note.tags,
            section_heading=heading,
            text=text,
            chunk_index=idx,
            metadata_text=meta,
        )
