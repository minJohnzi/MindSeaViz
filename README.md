# MindSeaViz

Visual knowledge base assistant for Obsidian vaults — Graph Browser + Dashboard + RAG Chat.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Web application (Python FastAPI + React/TypeScript), designed for future Electron wrapping.

## Modules

| Module | Description |
|--------|-------------|
| **Graph Browser** | Interactive node-edge visualization of `[[wikilinks]]` across the vault |
| **Dashboard** | Stats, tag cloud, orphan notes, inbox queue, recent changes |
| **Conversational Assistant** | RAG-augmented chat with Claude API, real-time graph overlay |

## Quick Start

### 一键启动 (Windows)

双击 `start.bat`，自动启动后端 + 前端并打开浏览器。

### 手动启动

**前置要求**: Python >= 3.11, Node.js >= 18

```bash
# 1. 后端
cp .env.example .env        # 编辑填入 ANTHROPIC_API_KEY
pip install -e ".[embedding]"
uvicorn main:app --host 127.0.0.1 --port 8001

# 2. 前端 (新终端)
cd frontend
npm install
npm run dev

# 3. 打开浏览器
# http://127.0.0.1:5173
```

### 配置

编辑 `config.yaml` 设置 vault 路径：

```yaml
vault:
  path: "E:/MindSea"   # 你的 Obsidian vault 路径
```
首次启动会自动下载 BGE-small-zh 嵌入模型 (~100MB)。

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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE) for details.
