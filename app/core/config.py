from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from pydantic import filed_validator,  model_validator
from pydantic.settings import BaseSettings, SettingsConfigDict 


BASE_DIR = Path(__file__).parent.parent.parent


class Settings(BaseSettings):
 
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

 
    app_name: str = "AegisSentinel-Net"
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_reload: bool = True
    app_log_level: str = "info"
 
 
    secret_key: str
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"
 
    postgres_user: str
    postgres_password: str
    postgres_db: str
    postgres_host: str = "aegisdb"
    postgres_port: int = 5432
    database_url: str
  
    model_violence_path: str = "ml/aegis_sentinel.onnx"
    model_pose_path: str = "ml/yolov11_nano_pose.onnx"
    model_weapons_path: str = "ml/yolov8_nano_weapons.onnx"
 
    violence_threshold: float = 0.62
    contact_iou_threshold: float = 0.40
    cooldown_frames: int = 30
    n_frames: int = 16
    img_size: int = 224
 
 
    websocket_max_size: int = 10485760
    frame_buffer_size: int = 16
    stream_fps_target: int = 30
 
 
    cors_origins: List[str] = ["http://localhost:3000"]
 
 
    @property
    def is_development(self) -> bool:
        return self.app_env == "development"
 
    @property
    def is_production(self) -> bool:
        return self.app_env == "production"
 
    @property
    def model_violence_abs(self) -> Path:
        return BASE_DIR / self.model_violence_path
 
    @property
    def model_pose_abs(self) -> Path:
        return BASE_DIR / self.model_pose_path
 
    @property
    def model_weapons_abs(self) -> Path:
        return BASE_DIR / self.model_weapons_path
 

    @field_validator("violence_threshold", "contact_iou_threshold")
    @classmethod
    def validate_thresholds(cls, v: float) -> float:
        if not 0.0 < v < 1.0:
            raise ValueError("Los thresholds deben estar entre 0 y 1 exclusivo")
        return v
 
    @field_validator("n_frames")
    @classmethod
    def validate_n_frames(cls, v: int) -> int:
        if v < 8 or v > 64:
            raise ValueError("n_frames debe estar entre 8 y 64")
        return v
 
    @model_validator(mode="after")
    def validate_model_files(self) -> "Settings":
        if self.is_production:
            for path, name in [
                (self.model_violence_abs, "violence"),
                (self.model_pose_abs, "pose"),
                (self.model_weapons_abs, "weapons"),
            ]:
                if not path.exists():
                    raise ValueError(
                        f"Modelo {name} no encontrado en produccion: {path}"
                    )
        return self
 
 
@lru_cache
def get_settings() -> Settings:
    """
    SingleTown Isntance from settings, cached for performance. Use get_settings() to access the settings throughout the app.
    """
    return Settings()

