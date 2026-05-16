"""MindSeaViz — Obsidian vault 可视化知识库助手。

FastAPI 应用入口。组装 API 路由和 CORS 中间件。
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import chat, config, graph, notes, stats

app = FastAPI(title="MindSeaViz", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notes.router)
app.include_router(graph.router)
app.include_router(stats.router)
app.include_router(chat.router)
app.include_router(config.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
