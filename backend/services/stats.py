"""聚合 vault 统计：笔记数、标签云、孤岛笔记、最近更新、收件箱。

孤岛 = 零 wikilinks 的笔记。收件箱按元数据缺失程度排序（无链接、无 tags 优先）。
"""

from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from core.parser.markdown import Parser
from core.vault.reader import VaultReader


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


class StatsEngine:
    """计算 vault 的聚合统计数据。"""

    RECENT_DAYS = 7

    def __init__(self, reader: VaultReader, parser: Parser):
        self.reader = reader
        self.parser = parser

    def overview(self) -> OverviewStats:
        """笔记总数、标签数、链接数、标签云 (top 50)、笔记类型分布、孤岛数。"""
        files = self.reader.list_files()
        tag_counter: Counter = Counter()
        type_counter: Counter = Counter()
        total_links = 0
        orphan_count = 0

        for f in files:
            raw = self.reader.read(f)
            note = self.parser.parse(f, raw)
            for t in note.tags:
                tag_counter[t] += 1
            total_links += len(note.wikilinks)
            if not note.wikilinks:
                orphan_count += 1
            note_type = note.frontmatter.get("type", "note")
            type_counter[note_type] += 1

        return OverviewStats(
            total_notes=len(files),
            total_tags=len(tag_counter),
            total_links=total_links,
            tag_counts=[{"tag": t, "count": c} for t, c in tag_counter.most_common(50)],
            note_type_distribution=dict(type_counter),
            orphan_count=orphan_count,
        )

    def orphans(self) -> list[dict]:
        """列出所有零 wikilinks 的笔记。"""
        files = self.reader.list_files()
        orphans: list[dict] = []
        for f in files:
            raw = self.reader.read(f)
            note = self.parser.parse(f, raw)
            if not note.wikilinks:
                orphans.append({"path": str(f), "title": note.title, "tags": note.tags})
        return orphans

    def recent(self) -> list[dict]:
        """最近 RECENT_DAYS 天内修改的笔记。"""
        files = self.reader.list_files()
        cutoff = datetime.now() - timedelta(days=self.RECENT_DAYS)
        recent: list[dict] = []
        for f in files:
            mtime = datetime.fromtimestamp(self.reader.file_modified_time(f))
            if mtime >= cutoff:
                recent.append({
                    "path": str(f),
                    "title": f.stem,
                    "modified": mtime.isoformat(),
                })
        recent.sort(key=lambda x: x["modified"], reverse=True)
        return recent

    def inbox(self) -> list[InboxItem]:
        """收件箱：元数据缺失的笔记优先显示（无 wikilinks / 无 tags）。"""
        files = self.reader.list_files()
        items: list[InboxItem] = []
        for f in files:
            raw = self.reader.read(f)
            note = self.parser.parse(f, raw)
            items.append(InboxItem(
                path=str(f),
                title=note.title,
                created=note.created,
                modified=note.modified,
                has_wikilinks=bool(note.wikilinks),
                has_tags=bool(note.tags),
            ))

        def sort_key(item: InboxItem) -> tuple[int, int]:
            score = 0
            if not item.has_wikilinks:
                score += 1
            if not item.has_tags:
                score += 1
            return (score, 0)

        items.sort(key=sort_key, reverse=True)
        return items[:50]
