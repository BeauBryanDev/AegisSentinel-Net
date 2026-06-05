import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import numpy as np
import onnxruntime as ort

from app.core.config import get_settings


logger = logging.getLogger("aegis.session")
settings = get_settings()


def _build_providers() -> list:
    """
    Returns the optimal execution providers for the current hardware.
    Prefers CUDAExecutionProvider when a compatible GPU is available,
    falls back to CPUExecutionProvider silently.
    """
    available = ort.get_available_providers()
    providers = []
 
    if "CUDAExecutionProvider" in available:
        providers.append(
            (
                "CUDAExecutionProvider",
                {
                    "device_id": 0,
                    "arena_extend_strategy": "kNextPowerOfTwo",
                    "gpu_mem_limit": 4 * 1024 ** 3,  # 4 GB VRAM cap
                    "cudnn_conv_algo_search": "EXHAUSTIVE",
                    "do_copy_in_default_stream": True,
                },
            )
        )
        logger.info("ONNX Runtime: CUDAExecutionProvider selected")
    else:
        logger.warning("ONNX Runtime: CUDA not available, falling back to CPU")
 
    providers.append("CPUExecutionProvider")
    return providers
 
 
def _load_session(model_path: Path, model_name: str) -> ort.InferenceSession:
    """
    Loads a single ONNX model into an InferenceSession.
    Raises FileNotFoundError with a clear message if the model is missing.
    """
    if not model_path.exists():
        raise FileNotFoundError(
            f"[{model_name}] ONNX model not found at: {model_path}\n"
            f"Make sure the .onnx file is present in ml/ before building Docker."
        )
 
    session_options = ort.SessionOptions()
    session_options.graph_optimization_level = (
        ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    )
    session_options.enable_mem_pattern = True
    session_options.enable_cpu_mem_arena = True
 
    session = ort.InferenceSession(
        str(model_path),
        sess_options=session_options,
        providers=_build_providers(),
    )
 
    input_shape = session.get_inputs()[0].shape
    output_names = [o.name for o in session.get_outputs()]
    size_mb = model_path.stat().st_size / 1e6
 
    logger.info(
        "[%s] Loaded — %.1f MB | input: %s | outputs: %s",
        model_name,
        size_mb,
        input_shape,
        output_names,
    )
    return session
 
 
@dataclass
class ModelRegistry:
    """
    Holds the three ONNX InferenceSession instances.
    Instantiated once at startup and stored in app.state.
 
    Attributes:
        violence  : AegisSentinel ResNet50 + Temporal Attention
        pose      : YOLOv11-nano body keypoints detector
        weapons   : YOLOv8-nano weapon detector (gun, knife, rifle)
    """
 
    violence: ort.InferenceSession = field(init=False)
    pose: ort.InferenceSession = field(init=False)
    weapons: ort.InferenceSession = field(init=False)
 
    def load(self) -> None:
        """
        Loads all three models into VRAM/RAM.
        Called once during FastAPI lifespan startup.
        Total VRAM usage: ~800 MB with three nano models + ResNet50.
        """
        logger.info("Loading inference models into memory...")
 
        self.violence = _load_session(
            settings.model_violence_abs, "ViolenceDetector"
        )
        self.pose = _load_session(
            settings.model_pose_abs, "PoseDetector"
        )
        self.weapons = _load_session(
            settings.model_weapons_abs, "WeaponDetector"
        )
 
        logger.info("All three models loaded and ready.")
 
    def warmup(self) -> None:
        """
        Runs a single dummy forward pass on each model after loading.
        Eliminates the JIT compilation delay on the first real inference request.
        Without warmup, the first WebSocket frame can take 2-5 seconds.
        """
        logger.info("Running model warmup passes...")
 
        dummy_violence = np.zeros(
            (1, settings.n_frames, 3, settings.img_size, settings.img_size),
            dtype=np.float32,
        )
        dummy_yolo = np.zeros(
            (1, 3, settings.img_size, settings.img_size),
            dtype=np.float32,
        )
 
        try:
            violence_input = self.violence.get_inputs()[0].name
            self.violence.run(None, {violence_input: dummy_violence})
            logger.info("ViolenceDetector warmup: OK")
        except Exception as exc:
            logger.warning("ViolenceDetector warmup failed: %s", exc)
 
        try:
            pose_input = self.pose.get_inputs()[0].name
            self.pose.run(None, {pose_input: dummy_yolo})
            logger.info("PoseDetector warmup: OK")
        except Exception as exc:
            logger.warning("PoseDetector warmup failed: %s", exc)
 
        try:
            weapons_input = self.weapons.get_inputs()[0].name
            self.weapons.run(None, {weapons_input: dummy_yolo})
            logger.info("WeaponDetector warmup: OK")
        except Exception as exc:
            logger.warning("WeaponDetector warmup failed: %s", exc)
 
        logger.info("Warmup complete. Models ready for real-time inference.")
 
 
model_registry = ModelRegistry()


def get_model_registry() -> ModelRegistry:
    """
    FastAPI dependency that returns the loaded ModelRegistry.
 
    Usage in a router:
 
        from app.core.session import get_model_registry
 
        @router.websocket("/ws/stream")
        async def stream(
            websocket: WebSocket,
            registry: ModelRegistry = Depends(get_model_registry),
        ):
            result = registry.violence.run(...)
    """
    return model_registry


def get_violence_session() -> ort.InferenceSession:
    return model_registry.violence
 
 
def get_pose_session() -> ort.InferenceSession:
    return model_registry.pose
 
 
def get_weapons_session() -> ort.InferenceSession:
    return model_registry.weapons
 