# CLAUDE.md — MindSeaViz

## Project

Visual knowledge base assistant for the MindSea Obsidian vault. Web app (Python FastAPI + React/TS), future Electron wrapper.

## Design Spec

Read `docs/superpowers/specs/2026-05-17-mindsea-viz-design.md` before any implementation. It is the single source of truth.

## Architecture (TL;DR)

```
API Layer (routers/)     → Pure routing, no business logic
Service Layer (services/) → "The Brain" — GraphEngine, SearchEngine, AIAgent, StatsEngine
Core Layer (core/)       → "The Library" — VaultReader, Parser, SemanticSplitter, Indexer,
                             WhooshIndex, LanceDBStore, SQLiteDB, EventBus, ConfigManager
```

## Key Technical Decisions

- **Hybrid Search**: Whoosh (BM25) + LanceDB (vector) → RRF fusion
- **Embedding**: BGE-small-zh on ONNX Runtime (CPU, ~100MB)
- **RAG**: Retriever → ContextBuilder → Claude API (SSE streaming)
- **Graph lib**: Adapter pattern (`IGraphRenderer`), start with Cytoscape.js
- **Config**: `config.yaml` driven, Pydantic validation
- **Splitter**: <500 chars = 1 chunk, >500 = split by `##`, metadata injection on every chunk

## Communication

- **SSE**: Chat streaming (`event: sources` + `event: message` + `event: done`)
- **WebSocket**: System events only (`index:progress`, `index:done`, `vault:changed`, `system:error`)

## Development Phases

| P1 | Core + Service (no AI) | Vault read, parse, index, graph, stats → REST API |
| P2 | Frontend shell + Graph + Dashboard | React app, Cytoscape.js graph, stats dashboard |
| P3 | RAG + Chat | LanceDB + BGE + hybrid search + Claude streaming |
| P4 | GraphOverlay + Polish | Two-layer graph overlay during chat, error states |
| P5 | Settings + Config | Settings page, config.yaml integration |
| Future | Electron + Open source | `electron-builder`, docs, license |

## Project Conventions

- Python: `pyproject.toml` or `requirements.txt` (TBD during P1)
- Frontend: Vite + React 18 + TypeScript + shadcn/ui + Tailwind + Zustand
- Graph rendering: `IGraphRenderer` interface, Cytoscape.js default impl
- Tests: TBD during P1
- Vault path: NEVER hardcoded, always from `config.yaml`

## Vault Dependency

This project reads from a MindSea Obsidian vault (markdown + `[[wikilinks]]` + frontmatter). The vault path is user-configurable. During development, point to `E:/MindSea`.

## Git

- Repo: `github.com/minJohnzi/MindSeaViz`
- Author: minJohnzi
- Branch: `main`
