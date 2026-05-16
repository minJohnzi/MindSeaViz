"""读取/更新运行时配置端点。"""

from fastapi import APIRouter, Depends

from api.dependencies import get_config
from core.config import AppConfig, ConfigManager

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("")
async def get_config_endpoint(cfg: AppConfig = Depends(get_config)):
    return cfg.model_dump()


@router.put("")
async def update_config_endpoint(data: dict, cfg: AppConfig = Depends(get_config)):
    mgr = ConfigManager()
    updated = AppConfig(**data)
    mgr._config = updated
    mgr.save()
    return {"ok": True}
