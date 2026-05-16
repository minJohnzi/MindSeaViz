"""Vault 统计端点：总览、孤岛笔记、最近更新。"""

from fastapi import APIRouter, Depends

from api.dependencies import get_stats_engine
from services.stats import StatsEngine

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/overview")
async def overview(engine: StatsEngine = Depends(get_stats_engine)):
    stats = engine.overview()
    return stats.__dict__


@router.get("/orphans")
async def orphans(engine: StatsEngine = Depends(get_stats_engine)):
    return {"orphans": engine.orphans()}


@router.get("/recent")
async def recent(engine: StatsEngine = Depends(get_stats_engine)):
    return {"recent": engine.recent()}
