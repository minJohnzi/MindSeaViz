"""解析 Obsidian markdown 笔记：YAML frontmatter、[[wikilinks]]、#tags。"""

import re
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class ParsedNote:
    relative_path: Path
    title: str
    content: str  # frontmatter 之后的正文
    frontmatter: dict = field(default_factory=dict)
    tags: list[str] = field(default_factory=list)
    wikilinks: list[str] = field(default_factory=list)
    created: str = ""
    modified: str = ""


class Parser:
    """从 Obsidian markdown 中提取 frontmatter、wikilinks 和 tags。"""

    WIKILINK_RE = re.compile(r"\[\[([^\]|#]+)(?:[^]]*)?\]\]")

    def parse(self, relative_path: Path, raw_text: str) -> ParsedNote:
        frontmatter, body = self._split_frontmatter(raw_text)
        return ParsedNote(
            relative_path=relative_path,
            title=frontmatter.get("title", relative_path.stem),
            content=body.strip(),
            frontmatter=frontmatter,
            tags=self._extract_tags(frontmatter, body),
            wikilinks=self._extract_wikilinks(body),
            created=str(frontmatter.get("created", "")),
            modified=str(frontmatter.get("modified", "")),
        )

    def _split_frontmatter(self, text: str) -> tuple[dict, str]:
        if not text.startswith("---"):
            return {}, text
        parts = text.split("---", 2)
        if len(parts) < 3:
            return {}, text
        try:
            import yaml
            fm = yaml.safe_load(parts[1]) or {}
        except Exception:
            fm = {}
        return fm, parts[2]

    def _extract_tags(self, frontmatter: dict, body: str) -> list[str]:
        tags: set[str] = set()
        fm_tags = frontmatter.get("tags", [])
        if isinstance(fm_tags, list):
            tags.update(t for t in fm_tags if isinstance(t, str))
        elif isinstance(fm_tags, str):
            tags.update(t.strip() for t in fm_tags.split(",") if t.strip())
        inline_tags = re.findall(r"#([\w一-鿿\-/]+)", body)
        tags.update(inline_tags)
        return sorted(tags)

    def _extract_wikilinks(self, body: str) -> list[str]:
        links = self.WIKILINK_RE.findall(body)
        return sorted(set(links))
