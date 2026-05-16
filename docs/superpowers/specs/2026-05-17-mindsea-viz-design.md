# MindSeaViz — Visual Knowledge Base Assistant Design Spec

**Date**: 2026-05-17
**Author**: minJohnzi
**Status**: Design Approved

## 1. Vision

A visual knowledge base assistant that works alongside the MindSea Obsidian vault. Three integrated modules:

| Module | Description |
|--------|-------------|
| **Graph Browser** | Interactive node-edge visualization of `[[wikilinks]]` in the vault |
| **Dashboard** | Stats, tag cloud, orphans, inbox queue, recent changes |
| **Conversational Assistant** | Chat with Claude API, RAG-augmented with vault knowledge, real-time graph overlay |

## 2. Runtime & Deployment

- **Primary**: Local web application (Python FastAPI + React SPA)
- **Future**: Wrap in Electron for desktop app (architecture preserves this path via clean frontend/backend separation)
- **Open source**: Config-driven (`config.yaml`), no hardcoded paths, Core layer publishable as independent `pip install` package

Repository: `E:\MindSeaViz` → `github.com/minJohnzi/MindSeaViz`

## 3. Architecture — Three-Layer Decoupling

```
API Layer    →  Routers + request validation. No business logic.
Service Layer →  Business orchestration. "The Brain."
Core Layer   →  Infrastructure primitives. "The Library." Zero external API dependencies.
```

### 3.1 Core Layer (`core/`)

| Module | Responsibility | Key Dependencies |
|--------|---------------|------------------|
| `VaultReader` | Read markdown files from configured vault path | `pathlib` |
| `Parser` | Parse frontmatter, extract wikilinks, tags, metadata | `python-frontmatter` |
| `SemanticSplitter` | Split notes into chunks: `<500 chars` → 1 chunk, `>500 chars` → split by `##`/`###` headings. Every chunk gets **metadata injection** (note title, tags, date, section heading) | — |
| `WhooshIndex` | Keyword inverted index (BM25) | `whoosh` |
| `LanceDBStore` | Vector store + embedding extraction via `BGE-small-zh` on ONNX Runtime. Exposes `insert(text, vector)` and `knn_search(vector)` | `lancedb`, `optimum[onnxruntime]`, `sentence-transformers` |
| `SQLiteDB` | System state + chat history persistence | `sqlite3` (stdlib) |
| `ConfigManager` | Load and validate `config.yaml` | `pydantic` |
| `EventBus` | `asyncio.Queue`-based debounced file watcher events, prevents I/O storms from `watchdog` | `watchdog`, `asyncio` |
| `Indexer` | Orchestrates the indexing pipeline: `VaultReader → Parser → SemanticSplitter → WhooshIndex + LanceDBStore`. Handles both full-scan (cold start) and incremental (per-file) indexing. | — |

### 3.2 Service Layer (`services/`)

| Module | Responsibility |
|--------|---------------|
| `GraphEngine` | Build graph from wikilinks. Compute shortest path, centrality, community detection, neighbor subgraphs. Returns `{nodes, edges}` JSON. Powered by `networkx`. |
| `SearchEngine` | Hybrid search orchestrator: query term extraction → parallel Whoosh + LanceDB → RRF fusion → Top-K. |
| `AIAgent` | RAG pipeline: `Retriever` (calls SearchEngine) → `ContextBuilder` (assembles chunks + metadata → prompt) → `Claude API call` (streaming). Manages chat sessions. |
| `StatsEngine` | Aggregate vault statistics: note counts by type/tag, orphans, recent changes, inbox queue. |
| `ChatSessionManager` | CRUD for chat sessions stored in SQLite. |

### 3.3 API Layer (`routers/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/notes` | GET | Note list (paginated) |
| `/api/notes/:id` | GET | Single note content |
| `/api/notes/search?q=` | GET | Hybrid search |
| `/api/graph` | GET | Full graph (nodes + edges) |
| `/api/graph/neighbors?ids=` | GET | Subgraph for one or more note IDs (depth param) |
| `/api/graph/shortest-path` | GET | Shortest path between two nodes |
| `/api/stats/overview` | GET | Overview stats (counts, distribution, tag cloud) |
| `/api/stats/orphans` | GET | Orphan notes |
| `/api/stats/recent` | GET | Recently updated |
| `/api/inbox` | GET | Inbox queue |
| `/api/chat/send` | POST | Send message → **SSE stream** with event types: `sources` (referenced notes metadata) and `message` (token delta) |
| `/api/chat/history/:sessionId` | GET | Chat history |
| `/api/chat/sessions` | GET | Session list |
| `/api/chat/sessions/:id` | DELETE | Delete session |
| `/api/config` | GET/PUT | Read/update config |

## 4. Communication Protocol

### SSE (Chat Streaming)
```
event: sources
data: [{"noteId":"...","title":"...","chunk":"...","score":0.87}, ...]

event: message
data: {"delta":"根据你的笔记..."}

event: message
data: {"delta":"..."}

event: done
data: {}
```

sources and message events are emitted **concurrently** — whichever completes first goes out first. This minimizes perceived latency (max(retrieval_time, first_token_time) instead of retrieval_time + first_token_time).

### WebSocket (System Events — Server → Client only)
```
index:progress   → Indexing progress percentage
index:done       → Indexing complete
vault:changed    → File add/modify/delete notification
system:error     → Engine-level severe errors
```

## 5. Frontend

### 5.1 Tech Stack
| Layer | Choice |
|-------|--------|
| Framework | React 18+ + TypeScript |
| Build | Vite |
| Graph Rendering | **Adapter pattern** — `IGraphRenderer` interface. Start with Cytoscape.js. Swap to react-force-graph or Sigma.js via config if needed. |
| UI Components | shadcn/ui (Radix + Tailwind) |
| Charts (Dashboard) | Recharts |
| State | Zustand |

### 5.2 Component Tree
```
App
├── Layout
│   ├── Sidebar (NavItem, VaultStatus, QuickSearch)
│   └── MainContent
├── GraphView
│   ├── GraphCanvas (via IGraphRenderer)
│   ├── GraphControls (zoom, filter, layout switch)
│   ├── NodeTooltip
│   └── NotePanel (click → detail sidebar)
├── Dashboard
│   ├── StatsCards, TagCloud, RecentNotes
│   ├── OrphanWarning, InboxQueue
├── ChatPanel
│   ├── ChatMessages (UserMessage, AssistantMessage with note cards)
│   ├── ChatInput
│   ├── ContextPreview (injected chunks)
│   └── GraphOverlay (two-layer: RAG sources + wikilink neighbors)
└── Settings
    ├── VaultPathSelector, ModelSettings, EmbeddingSettings
```

### 5.3 GraphOverlay — Two-Layer Display
- **Layer 1 (highlighted)**: Notes retrieved by RAG (from `event:sources`) — "What the AI read"
- **Layer 2 (dimmed/dashed)**: wikilink neighbors of those notes — "Your knowledge structure"
- The gap between layers is informative: semantic similarity ≠ topological proximity

## 6. Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Embedding model | BGE-small-zh on ONNX Runtime | ~100MB, CPU-only, zero API cost, strong Chinese-English mixed semantics |
| Vector store | LanceDB | Disk-native, embedded, no server process, perfect for Obsidian-scale |
| Keyword index | Whoosh | Pure Python, no JVM dependency |
| Fusion algorithm | RRF (Reciprocal Rank Fusion) | Simple, no hyperparameter tuning |
| Text splitting | `<500 chars: 1 chunk`, `>500: split by ##/###` | Headings are natural semantic boundaries |
| Metadata injection | Every chunk prepends `[Note: X] [Tags: Y] [Date: Z] [Section: W]` | Prevents decontextualized chunks |
| Graph algorithms | NetworkX (backend) | Rich graph algorithms; frontend only renders |
| Config | `config.yaml` + Pydantic validation | Open-source friendly, no hardcoding |

## 7. SQLite Schema (Initial)

```sql
-- Chat sessions
CREATE TABLE chat_sessions (
    id TEXT PRIMARY KEY,
    title TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages
CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT REFERENCES chat_sessions(id),
    role TEXT NOT NULL,  -- 'user' | 'assistant'
    content TEXT NOT NULL,
    sources JSON,  -- referenced note metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System state
CREATE TABLE system_state (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index metadata (for tracking what's indexed)
CREATE TABLE index_metadata (
    note_path TEXT PRIMARY KEY,
    file_hash TEXT,
    chunk_count INTEGER,
    last_indexed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 8. config.yaml Structure

```yaml
vault:
  path: "E:/MindSea"        # Path to Obsidian vault (configurable)
  ignore_patterns:           # Directories to skip
    - ".git"
    - ".obsidian"
    - "_templates"

server:
  host: "127.0.0.1"
  port: 8000

ai:
  provider: "anthropic"
  model: "claude-sonnet-4-6"
  api_key_env: "ANTHROPIC_API_KEY"

embedding:
  model: "BAAI/bge-small-zh"
  device: "cpu"              # or "cuda"
  onnx: true

search:
  hybrid:
    algorithm: "rrf"          # Reciprocal Rank Fusion (no weights needed)
    rrf_k: 60                 # RRF smoothing constant
  top_k: 10

index:
  auto_index: true           # Watch vault for changes
  debounce_ms: 2000          # Debounce file watcher events
```

## 9. Development Phasing

| Phase | Scope | Deliverable |
|-------|-------|-------------|
| **P1** | Core Layer + Service Layer (no AI) | Vault reader, parser, indexer, graph engine, stats engine. REST API for notes, graph, stats. |
| **P2** | Frontend shell + Graph View + Dashboard | React app with navigation, graph canvas (Cytoscape.js), dashboard with stats cards + tag cloud. |
| **P3** | RAG Pipeline + Chat | LanceDB + BGE + hybrid search + Claude API integration. SSE streaming chat. Context preview. |
| **P4** | GraphOverlay + Polish | Two-layer graph overlay during chat. UI polish, error states, loading states. |
| **P5** | Settings + Configuration | Settings page, config.yaml integration, vault path switching. |
| **Future** | Electron wrapper + Open source prep | `electron-builder`, documentation, `CONTRIBUTING.md`, license. |

## 10. Non-Goals (v1)

- Multi-user support
- Remote deployment / cloud sync
- Real-time collaboration
- Plugin system
- Mobile app
- Non-Markdown vault formats
