import logging
from datetime import datetime
 
import numpy as np
 
from app.core.config import get_settings
from app.core.session import ModelRegistry
from app.services.alert_service import (
    AlertConsolidator,
    compute_alert_level,
    compute_detection_type,
)
from app.services.inference_engine import AegisInferenceEngine
from app.services.pose_service import PoseService
from app.services.weapon_service import WeaponService
from app.utils.preprocess import preprocess_violence
    
from collections import deque
 
# One StreamProcessor per WebSocket connection. For each frame:
#   i. Pose detection (always on)     -> persons, contact trigger
#   ii. Weapon detection (always on)      -> weapons
#   iii. Violence inference (conditional)  -> only when triggered
#   iv. Alert fusion                      -> alert level + event lifecycle
#   v. Build the response payload for the frontend

logger = logging.getLogger("aegis.stream")
settings = get_settings()

 
class StreamProcessor:
    """
    Holds the per-stream state (frame counter, inference engine
    buffer, alert consolidator) and runs the per-frame pipeline.
    """
 
    def __init__(self, registry: ModelRegistry,
                 camera_id: str | None = None
                 ):
        self.camera_id = camera_id or "CAM-01"
        self.frame_number = 0
 
        # Stateless services (shared sessions, no per-stream state)
        self.pose    = PoseService(registry.pose)
        self.weapons = WeaponService(registry.weapons)
 
        # Stateful per-stream components
        self.engine       = AegisInferenceEngine(registry.violence)
        self.consolidator = AlertConsolidator()
        
        self.prob_history = deque(maxlen=3)
 
 
    def process_frame(self, frame_bgr: np.ndarray) -> dict:
        """
        Full pipeline for a single frame.
        Returns the payload to send back through the WebSocket,
        plus internal fields for persistence (prefixed with '_').
        """
        self.frame_number += 1
        frame_time = datetime.utcnow()
 
        # i. Pose detection (always on)
        pose_result = self.pose.detect(frame_bgr)
 
        # ii. Weapon detection (always on)
        weapon_result = self.weapons.detect(frame_bgr)
 
        # iii. Conditional violence inference
        violence_frame = preprocess_violence(frame_bgr)
        violence_result = self.engine.add_frame(
            violence_frame,
            contact_detected=pose_result["contact"],
        )
 
        violence_triggered = bool(
            violence_result and violence_result["is_violence"]
        )
        violence_prob = (
            violence_result["violence_prob"] if violence_result else None
        )
        
        if violence_prob is not None:
            
            self.prob_history.append(violence_prob)
            
            smooth_prob = sum(self.prob_history) / len(self.prob_history)
        else:
            smooth_prob = None

 
        # iv. Alert fusion
        alert_level = compute_alert_level(
            violence_triggered=violence_triggered,
            weapon_detected=weapon_result["weapon_detected"],
            persons_count=pose_result["persons_count"],
            contact=pose_result["contact"],
        )
        detection_type = compute_detection_type(
            violence_triggered=violence_triggered,
            weapon_detected=weapon_result["weapon_detected"],
            contact=pose_result["contact"],
        )
        event_action = self.consolidator.update(
            alert_level, detection_type, self.camera_id
        )
 
        # v. Build payload
        payload = {
            "frame_number": self.frame_number,
            "frame_time":   frame_time.isoformat(),
            "camera_id":    self.camera_id,
 
            "persons":        pose_result["persons"],
            "persons_count":  pose_result["persons_count"],
            "contact":        pose_result["contact"],
            "contact_pairs":  pose_result["contact_pairs"],
 
            "weapon_detected": weapon_result["weapon_detected"],
            "weapons":         weapon_result["weapons"],
 
            "engine_awake":  self.engine.is_triggered,
            "violence_prob": violence_prob,
            "is_violence":   violence_triggered,
            "attention":     violence_result["attention"] if violence_result else None,
 
            "alert_level":    alert_level.value,
            "detection_type": detection_type.value,
            # Smoothed violence probability for frontend display (not for persistence)
            "violence_prob_smooth": smooth_prob,
 
            # Internal fields for the router to persist (not for frontend)
            "_event_action":  event_action,
            "_weapons_data":  weapon_result["weapons_data"],
            "_frame_time_dt": frame_time,
            
        }
        
        return payload
    
    
 
    def should_persist(self, payload: dict) -> bool:
        """
        Persistence policy: store only meaningful frames, not all 30/s.
        - Always store frames with MEDIUM or higher alert.
        - Store CONTACT frames at most once per second (sampling).
        """
        level = payload["alert_level"]
        
        if level in ("medium", "high", "critical"):
            
            return True
        
        if level == "low" and payload["contact"]:
            
            return self.frame_number % settings.stream_fps_target == 0
        
        return False
 
 
    def reset(self) -> None:
        
        """Call on stream restart or reconnect."""
        self.frame_number = 0
        self.engine.reset()
        self.consolidator.reset()
        logger.info("StreamProcessor reset for camera %s", self.camera_id)
 
 
 