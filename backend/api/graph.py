"""图谱端点：完整图、邻居子图、最短路径。"""

from fastapi import APIRouter, Depends, Query

from api.dependencies import get_graph_engine
from services.graph import GraphEngine

router = APIRouter(prefix="/api/graph", tags=["graph"])


@router.get("")
async def full_graph(engine: GraphEngine = Depends(get_graph_engine)):
    data = engine.build()
    return {"nodes": data.nodes, "edges": data.edges}


@router.get("/neighbors")
async def neighbors(
    ids: str = Query(""),
    depth: int = Query(1),
    engine: GraphEngine = Depends(get_graph_engine),
):
    node_ids = [i.strip() for i in ids.split(",") if i.strip()]
    data = engine.neighbors(node_ids, depth)
    return {"nodes": data.nodes, "edges": data.edges}


@router.get("/shortest-path")
async def shortest_path(
    source: str,
    target: str,
    engine: GraphEngine = Depends(get_graph_engine),
):
    path = engine.shortest_path(source, target)
    return {"path": path}
