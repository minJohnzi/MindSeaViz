# Contributing to MindSeaViz

感谢你的贡献。

## 快速开始

```bash
git clone https://github.com/minJohnzi/MindSeaViz.git
cd MindSeaViz

# 后端
pip install -e ".[embedding]"
cp .env.example .env   # 编辑填入 ANTHROPIC_API_KEY
uvicorn main:app --host 127.0.0.1 --port 8001 --reload

# 前端 (新终端)
cd frontend
npm install
npx vite --host 127.0.0.1 --port 5173
```

或双击 `start.bat` 一键启动。

## 项目结构

见 [docs/file-structure.md](docs/file-structure.md)。

## 开发流程

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feat/your-feature`
3. 提交代码
4. 推送到你的 Fork
5. 提交 Pull Request

## Commit 规范

- `feat:` — 新功能
- `fix:` — Bug 修复
- `docs:` — 文档变更
- `refactor:` — 重构
- `chore:` — 构建/工具

## 技术栈

- 后端：Python 3.11+ / FastAPI / SQLite / LanceDB / Whoosh / NetworkX
- 前端：React 18 / TypeScript / Vite / Tailwind CSS / shadcn/ui / Cytoscape.js
- AI：Claude API / BGE-small-zh 嵌入模型 (ONNX Runtime)

## 设计规范

所有实现应遵循 [设计规范](docs/superpowers/specs/2026-05-17-mindsea-viz-design.md)。
