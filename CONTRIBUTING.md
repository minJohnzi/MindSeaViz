# 参与贡献

感谢你对 MindSeaViz 的贡献。

## 环境搭建

```bash
git clone https://github.com/minJohnzi/MindSeaViz.git
cd MindSeaViz

# 后端
pip install -e ".[embedding]"
cp .env.example .env          # 编辑填入 ANTHROPIC_API_KEY
uvicorn main:app --host 127.0.0.1 --port 8001 --reload

# 前端（新终端）
cd frontend && npm install
npx vite --host 127.0.0.1 --port 5173
```

或双击 `start.bat` 一键启动。

## 项目结构

见 [docs/file-structure.md](docs/file-structure.md)。后端采用三层解耦：`core/`（基础组件）→ `services/`（业务编排）→ `api/`（路由层）。

## 开发流程

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feat/功能名`
3. 开发并提交
4. 推送到你的 Fork
5. 提交 Pull Request

## Commit 规范

- `feat:` — 新功能
- `fix:` — Bug 修复
- `docs:` — 文档变更
- `refactor:` — 重构
- `chore:` — 构建/依赖

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Python 3.11+ / FastAPI / SQLite / LanceDB / Whoosh / NetworkX |
| AI | Claude API / BGE-small-zh (ONNX Runtime) |
| 前端 | React 18 / TypeScript / Vite / Tailwind CSS / shadcn/ui |
| 图谱 | NetworkX (后端) / Cytoscape.js (前端) |

## 设计规范

实现应遵循 [设计规范](docs/superpowers/specs/2026-05-17-mindsea-viz-design.md)。
