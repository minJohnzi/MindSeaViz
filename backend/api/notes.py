"""笔记列表、详情、搜索端点。"""

from pathlib import Path

from fastapi import APIRouter, Depends

from api.dependencies import get_vault_reader, get_parser, get_search_engine
from core.vault.reader import VaultReader
from core.parser.markdown import Parser
from services.search.hybrid import SearchEngine

router = APIRouter(prefix="/api/notes", tags=["notes"])


@router.get("")
async def list_notes(
    page: int = 1,
    size: int = 50,
    reader: VaultReader = Depends(get_vault_reader),
    parser: Parser = Depends(get_parser),
):
    all_files = reader.list_files()
    start = (page - 1) * size
    batch = all_files[start : start + size]
    notes = []
    for f in batch:
        raw = reader.read(f)
        note = parser.parse(f, raw)
        notes.append({
            "path": str(f),
            "title": note.title,
            "tags": note.tags,
            "created": note.created,
            "modified": note.modified,
        })
    return {"notes": notes, "page": page, "size": size, "total": len(all_files)}


# /search 必须在 /{note_id:path} 之前注册，否则 "search" 会被当作 note_id 匹配
@router.get("/search")
async def search_notes(
    q: str = "",
    engine: SearchEngine = Depends(get_search_engine),
):
    if not q:
        return {"query": q, "results": []}
    results = engine.search(q)
    return {
        "query": q,
        "results": [
            {"note_path": r.note_path, "title": r.title, "chunk": r.chunk, "score": r.score}
            for r in results
        ],
    }


@router.get("/{note_id:path}")
async def get_note(
    note_id: str,
    reader: VaultReader = Depends(get_vault_reader),
    parser: Parser = Depends(get_parser),
):
    raw = reader.read(note_id)
    note = parser.parse(Path(note_id), raw)
    return {
        "path": str(note.relative_path),
        "title": note.title,
        "content": note.content,
        "frontmatter": note.frontmatter,
        "tags": note.tags,
        "wikilinks": note.wikilinks,
    }
