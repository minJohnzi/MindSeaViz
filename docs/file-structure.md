# MindSeaViz — 项目文件结构

**日期**: 2026-05-17
**版本**: 0.1.0

## 总览

```
MindSeaViz/
├── backend/
│   ├── core/                   # 基础设施库 — 按技术领域分组
│   │   ├── db/                 #   数据库驱动
│   │   ├── search/             #   本地检索引擎
│   │   ├── vault/              #   文件系统交互
│   │   ├── parser/             #   解析与切分算法
│   │   ├── config.py           #   配置管理
│   │   └── indexer.py          #   索引协调器
│   ├── services/               # 业务逻辑 — 按业务领域分组
│   │   ├── chat/               #   对话 (agent + session)
│   │   ├── search/             #   混合检索
│   │   ├── graph.py            #   知识图谱
│   │   └── stats.py            #   统计分析
│   ├── api/                    # FastAPI 路由层
│   │   ├── dependencies.py     #   依赖注入
│   │   ├── chat.py             #   SSE 流式聊天
│   │   ├── graph.py            #   图谱查询
│   │   ├── notes.py            #   笔记浏览
│   │   ├── stats.py            #   统计数据
│   │   └── config.py           #   配置管理
│   ├── models/                 # 数据模型层 (独立于 core/services)
│   │   ├── schemas.py          #   Pydantic API 模型
│   │   └── entities.py         #   领域实体 (dataclass)
│   └── main.py                 # FastAPI 入口
├── frontend/                   # React + TypeScript 前端
├── data/                       # 运行时数据 (自动生成)
├── config.yaml                 # 项目配置
├── pyproject.toml              # Python 依赖
├── README.md
└── docs/
```

## 后端架构 — 按领域分组

### Core 层 — 基础设施 (按技术分组)

| 路径 | 类 | 职责 |
|------|-----|------|
| `core/config.py` | `ConfigManager` | 加载/保存 config.yaml |
| `core/vault/reader.py` | `VaultReader` | 读取 Obsidian vault markdown 文件 |
| `core/vault/watcher.py` | `EventBus` | 异步 pub/sub 事件总线 |
| `core/parser/markdown.py` | `Parser` | 解析 frontmatter + wikilinks + tags |
| `core/parser/splitter.py` | `SemanticSplitter` | 按 ## 标题拆分 chunks + 元数据注入 |
| `core/search/whoosh.py` | `WhooshIndex` | BM25 关键词倒排索引 |
| `core/db/sqlite.py` | `SQLiteDB` | 聊天记录 + 系统状态持久化 |
| `core/db/lancedb.py` | `LanceDBStore` | 向量存储 + BGE-small-zh 嵌入 |
| `core/indexer.py` | `Indexer` | 编排全量/增量索引流程 |

### Service 层 — 业务逻辑 (按业务分组)

| 路径 | 类 | 职责 |
|------|-----|------|
| `services/chat/agent.py` | `AIAgent` | RAG → Claude API SSE 流式 |
| `services/chat/session.py` | `ChatSessionManager` | 会话 CRUD |
| `services/search/hybrid.py` | `SearchEngine` | Whoosh + LanceDB → RRF 融合 |
| `services/graph.py` | `GraphEngine` | wikilinks 图谱构建与查询 |
| `services/stats.py` | `StatsEngine` | 标签云、孤岛检测、收件箱 |

### API 层 — 路由

| 路径 | 前缀 | 端点 |
|------|------|------|
| `api/notes.py` | `/api/notes` | GET list, GET/{id}, GET/search |
| `api/graph.py` | `/api/graph` | GET graph, GET/neighbors, GET/shortest-path |
| `api/stats.py` | `/api/stats` | GET/overview, GET/orphans, GET/recent |
| `api/chat.py` | `/api/chat` | POST/send (SSE), GET/history, GET/sessions, DELETE/sessions |
| `api/config.py` | `/api/config` | GET, PUT |
| `api/dependencies.py` | — | FastAPI Depends 注入点 |

### Models 层 — 数据模型

| 路径 | 内容 |
|------|------|
| `models/schemas.py` | Pydantic 模型 (API 校验/序列化) |
| `models/entities.py` | Dataclass 实体 (内部领域对象) |

## 前端

| 路径 | 说明 |
|------|------|
| `frontend/src/components/Layout/` | Sidebar, MainContent |
| `frontend/src/components/GraphView/` | GraphCanvas, GraphControls, NotePanel |
| `frontend/src/components/Dashboard/` | StatsCards, TagCloud, RecentNotes |
| `frontend/src/components/ChatPanel/` | ChatMessages, ChatInput, ContextPreview, GraphOverlay |
| `frontend/src/stores/` | Zustand |
| `frontend/src/api/` | API 客户端 |
