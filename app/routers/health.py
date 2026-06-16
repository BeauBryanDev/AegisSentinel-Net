
import logging
from datetime import datetime
 
from fastapi import APIRouter, Depends
 
from app.core.config import Settings, get_settings
from app.core.session import ModelRegistry, get_model_registry
 
router = APIRouter(prefix="/api/v1", tags=["health"])
logger = logging.getLogger("aegis.health")
 
 
@router.get("/health")
async def health(
    settings: Settings = Depends(get_settings),
    registry: ModelRegistry = Depends(get_model_registry),
) -> dict:
    """
    Returns server status and model availability.
    Docker HEALTHCHECK hits this endpoint every 30s.
    Frontend polls this on startup before opening WebSocket.
    """
    models_ok = (
        registry.violence is not None
        and registry.pose is not None
        and registry.weapons is not None
    )
 
    return {
        "status":    "ok" if models_ok else "degraded",
        "app_name":  settings.app_name,
        "env":       settings.app_env,
        "models":    models_ok,
        "timestamp": datetime.utcnow().isoformat(),
    }
 