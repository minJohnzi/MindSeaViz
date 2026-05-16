"""从 Obsidian vault 读取 markdown 文件，跳过忽略目录。"""

from pathlib import Path


class VaultReader:
    """扫描并读取 vault 目录中的 markdown 文件。"""

    def __init__(self, vault_path: str | Path):
        self.vault_path = Path(vault_path)
        self.ignore_patterns: list[str] = []

    def set_ignore_patterns(self, patterns: list[str]) -> None:
        self.ignore_patterns = patterns

    def _should_ignore(self, path: Path) -> bool:
        for pattern in self.ignore_patterns:
            if pattern in path.parts:
                return True
        return False

    def list_files(self) -> list[Path]:
        """返回 vault 中所有 .md 文件，排除忽略目录。"""
        files: list[Path] = []
        for p in self.vault_path.rglob("*.md"):
            if not self._should_ignore(p):
                files.append(p.relative_to(self.vault_path))
        return files

    def read(self, relative_path: str | Path) -> str:
        full_path = self.vault_path / relative_path
        return full_path.read_text(encoding="utf-8")

    def read_batch(self, paths: list[Path]) -> dict[Path, str]:
        return {p: self.read(p) for p in paths}

    def file_modified_time(self, relative_path: str | Path) -> float:
        return (self.vault_path / relative_path).stat().st_mtime
