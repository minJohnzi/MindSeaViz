"""读取/更新运行时配置端点。"""

from fastapi import APIRouter, Depends

from api.dependencies import get_config
from core.config import AppConfig, ConfigManager

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("")
async def get_config_endpoint(cfg: AppConfig = Depends(get_config)):
    """返回当前完整配置（不含敏感信息）。"""
    d = cfg.model_dump()
    # 不暴露 api_key_env 值
    if "ai" in d and "api_key_env" in d["ai"]:
        d["ai"]["api_key_env"] = "***"
    return d


@router.put("")
async def update_config_endpoint(data: dict, cfg: AppConfig = Depends(get_config)):
    """更新部分配置并保存到 config.yaml。传入的字段会合并，未传的保留原值。"""
    import copy

    # 深度合并：递归更新已加载的配置
    merged = _deep_merge(cfg.model_dump(), data)
    updated = AppConfig(**merged)

    # 写回 config.yaml
    mgr = ConfigManager()
    mgr._config = updated
    mgr.save()

    # 清除缓存使下次请求读取新配置
    get_config.cache_clear()

    return {"ok": True, "config": updated.model_dump()}


def _deep_merge(base: dict, override: dict) -> dict:
    """递归合并 override 到 base，保留 base 中未提及的键。"""
    result = copy.deepcopy(base)
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value
    return result
