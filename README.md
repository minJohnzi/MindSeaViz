# MindSeaViz

Obsidian vault 可视化知识库助手 —— 知识图谱 + 仪表盘 + RAG 对话。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Web 应用（Python FastAPI + React/TypeScript），架构预留 Electron 桌面版路径。

## 功能模块

| 模块 | 说明 |
|------|------|
| **知识图谱** | `[[wikilinks]]` 交互式节点-边可视化，5 种布局，节点搜索筛选 |
| **仪表盘** | 笔记统计、标签云、孤岛检测、最近更新 |
| **RAG 对话** | 混合检索（BM25 + 向量）+ Claude API 流式回复，双层图谱叠加 |

## 快速开始

### 一键启动 (Windows)

双击 `start.bat`，自动启动后端 + 前端并打开浏览器。

### 手动启动

**环境要求**: Python >= 3.11, Node.js >= 18

```bash
# 1. 配置 API Key
cp .env.example .env     # 编辑填入 ANTHROPIC_API_KEY

# 2. 安装依赖
pip install -e ".[embedding]"

# 3. 启动后端 (端口 8001)
uvicorn main:app --host 127.0.0.1 --port 8001

# 4. 启动前端 (新终端, 端口 5173)
cd frontend && npm install && npx vite --host 127.0.0.1 --port 5173
```

浏览器打开 http://127.0.0.1:5173。

### 配置 vault 路径

编辑项目根目录 `config.yaml`：

```yaml
vault:
  path: "E:/MindSea"   # 你的 Obsidian vault 路径
```

首次启动会自动从国内镜像 `hf-mirror.com` 下载 BGE-small-zh 嵌入模型（约 100MB），之后离线可用。

## 架构

```
API 层 (api/)        → 纯路由，无业务逻辑
Service 层 (services/) → 业务编排，大脑
Core 层 (core/)       → 基础组件库，零外部 API 依赖
```

### Core 层 — 基础设施

| 路径 | 职责 |
|------|------|
| `core/vault/` | VaultReader 文件读取 + EventBus 事件总线 |
| `core/parser/` | Markdown 解析（frontmatter、wikilinks、tags）+ 语义拆分 |
| `core/db/` | SQLite 持久化 + LanceDB 向量存储 |
| `core/search/` | Whoosh BM25 关键词倒排索引 |
| `core/config.py` | config.yaml 加载/保存，.env 环境变量 |

### Service 层 — 业务逻辑

| 路径 | 职责 |
|------|------|
| `services/graph.py` | NetworkX 知识图谱构建与查询 |
| `services/search/hybrid.py` | 混合检索编排（Whoosh + LanceDB → RRF 融合） |
| `services/chat/agent.py` | RAG 流水线 → Claude API SSE 流式 |
| `services/chat/session.py` | 聊天会话 CRUD |
| `services/stats.py` | 聚合统计（标签云、孤岛、收件箱） |

## 核心技术选型

| 决策 | 选择 | 理由 |
|------|------|------|
| 嵌入模型 | BGE-small-zh + ONNX Runtime | ~100MB，CPU 推理，零 API 费用 |
| 向量存储 | LanceDB | 磁盘原生，嵌入式，无需服务进程 |
| 关键词索引 | Whoosh | 纯 Python，BM25 |
| 融合算法 | RRF (Reciprocal Rank Fusion) | 简单，无需调参 |
| 文本拆分 | <500 字符 1 chunk，>500 按 ## 标题拆 | 标题是自然语义边界 |
| 元数据注入 | 每个 chunk 前缀 `[标题] [tags] [章节]` | 防止 chunk 脱离上下文 |
| 图谱 | 后端 NetworkX + 前端 Cytoscape.js | 适配器模式，可替换渲染器 |
| 配置 | config.yaml + Pydantic 校验 | 无硬编码路径 |

## 通信协议

- **SSE** — 聊天流式输出：`event: sources` → `event: message` → `event: done`
- **WebSocket** — 系统事件：`index:progress`、`index:done`、`vault:changed`、`system:error`

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/notes` | GET | 笔记列表（分页） |
| `/api/notes/{id}` | GET | 单篇笔记详情 |
| `/api/notes/search?q=` | GET | 混合检索 |
| `/api/graph` | GET | 完整图谱 |
| `/api/graph/neighbors?ids=` | GET | 邻居子图 |
| `/api/graph/shortest-path` | GET | 最短路径 |
| `/api/stats/overview` | GET | 总览统计 |
| `/api/stats/orphans` | GET | 孤岛笔记 |
| `/api/stats/recent` | GET | 最近更新 |
| `/api/chat/send` | POST | 发送消息（SSE 流式） |
| `/api/chat/sessions` | GET | 会话列表 |
| `/api/chat/history/{id}` | GET | 聊天历史 |
| `/api/config` | GET/PUT | 读取/更新配置 |

## 项目结构

详见 [docs/file-structure.md](docs/file-structure.md)。

## 参与贡献

详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

MIT — 详见 [LICENSE](LICENSE)。
