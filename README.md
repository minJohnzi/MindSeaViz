# MindSeaViz

Visual knowledge base assistant for the MindSea Obsidian vault.

Web application (Python FastAPI + React/TypeScript), designed for future Electron wrapper.

## Modules

| Module | Description |
|--------|-------------|
| **Graph Browser** | Interactive node-edge visualization of `[[wikilinks]]` across the vault |
| **Dashboard** | Stats, tag cloud, orphan notes, inbox queue, recent changes |
| **Conversational Assistant** | RAG-augmented chat with Claude API, real-time graph overlay |

## Quick Start

### Prerequisites

- Python >= 3.11
- Node.js >= 18

### Backend

```bash
cd backend
pip install -e ".[embedding]"
cp config.yaml.example config.yaml   # edit vault.path to your Obsidian vault
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Architecture

```
┌────────────────────────────────────────┐
│  API Layer (routers/)                  │  ← Pure routing, no business logic
├────────────────────────────────────────┤
│  Service Layer (services/)             │  ← The Brain — orchestrates features
├────────────────────────────────────────┤
│  Core Layer (core/)                    │  ← The Library — zero external API deps
└────────────────────────────────────────┘
```

### Layer Responsibilities

**Core** — Infrastructure primitives. Publishable as independent `pip` package.
- VaultReader, Parser, SemanticSplitter, Indexer
- WhooshIndex (BM25), LanceDBStore (vector, BGE-small-zh)
- SQLiteDB, ConfigManager, EventBus

**Service** — Business orchestration. "The Brain."
- GraphEngine (NetworkX + wikilinks)
- SearchEngine (RRF fusion: Whoosh + LanceDB)
- AIAgent (RAG → Claude API streaming)
- StatsEngine (aggregates, orphans, tag cloud)
- ChatSessionManager

**API** — FastAPI routers. No logic, just validate → call service → respond.

## Key Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Embedding | BGE-small-zh on ONNX | ~100MB, CPU-only, no API cost |
| Vector store | LanceDB | Disk-native, embedded, no server |
| Keyword index | Whoosh | Pure Python, BM25 |
| Fusion | RRF (Reciprocal Rank Fusion) | Simple, no tuning |
| Text split | `<500 chars: 1 chunk`, `>500: split by ##` | Headings = natural boundaries |
| Graph | NetworkX backend, Cytoscape.js frontend | Adapter pattern for future swap |
| Config | `config.yaml` + Pydantic | No hardcoded paths |

## Communication

- **SSE** — Chat streaming (`event: sources` + `event: message` + `event: done`)
- **WebSocket** — System events (`index:progress`, `index:done`, `vault:changed`, `system:error`)

## Development Phases

| Phase | Scope |
|-------|-------|
| P1 | Core + Service (REST API for notes, graph, stats) |
| P2 | Frontend shell + Graph View + Dashboard |
| P3 | RAG + Chat (LanceDB + BGE + Claude streaming) |
| P4 | GraphOverlay + Polish |
| P5 | Settings + Config |
| Future | Electron wrapper |

## Config

```yaml
vault:
  path: "E:/MindSea"
  ignore_patterns: [".git", ".obsidian", "_templates"]
server:
  host: "127.0.0.1"
  port: 8000
ai:
  model: "claude-sonnet-4-6"
embedding:
  model: "BAAI/bge-small-zh"
  device: "cpu"
search:
  hybrid:
    algorithm: "rrf"
    rrf_k: 60
  top_k: 10
```

## Project Structure

See [docs/file-structure.md](docs/file-structure.md)

## License

TBD
