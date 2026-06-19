import logging
 
import cv2
import numpy as np
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
 
from app.core.database import AsyncSessionLocal
from app.core.session import ModelRegistry, get_model_registry
from app.schemas.detections import DetectionCreate
from app.schemas.events import EventCreate, EventUpdate
from app.services.detection_service import DetectionService
from app.services.event_service import EventService
from app.services.recording_service import RecordingService
from app.services.stream_service import StreamProcessor
 
 
logger = logging.getLogger("aegis.stream")

router = APIRouter(prefix="/api/v1", tags=["stream"])


@router.websocket("/ws/stream")
async def stream_endpoint(
    websocket: WebSocket,
    registry: ModelRegistry = Depends(get_model_registry),
):
    await websocket.accept()
    logger.info("WebSocket connected: %s", websocket.client)
 
    processor = StreamProcessor(registry)
    recording_id = None
    current_event_id = None
 
    # Open a recording session
    async with AsyncSessionLocal() as db:
        
        try:
            recording = await RecordingService.open(
                db, camera_id=processor.camera_id,
            )
            recording_id = recording.id
            
            await db.commit()
            
            logger.info("Recording started: id=%s", recording_id)
            
        except Exception as exc:
            
            logger.error("Failed to open recording: %s", exc)
 
    try:
        while True:
            # Receive JPEG bytes from the browser
            jpeg_bytes = await websocket.receive_bytes()
 
            # Decode to BGR numpy array
            frame = _decode_frame(jpeg_bytes)
            
            if frame is None:
                
                await websocket.send_json({"error": "invalid_frame"})
                
                continue
 
            # Run the full inference pipeline
            payload = processor.process_frame(frame)
 
            # Persist meaningful detections only
            if processor.should_persist(payload) and recording_id:
                await _persist_detection(payload, recording_id)

            # Persist event lifecycle (open/escalate/close) if the
            # alert consolidator emitted an action this frame
            event_action = payload.get("_event_action")
            
            if event_action and recording_id:
                
                current_event_id = await _persist_event_action(
                    
                    event_action, recording_id, current_event_id,
                )
 
            # Send telemetry to frontend (strip internal fields)
            response = _build_response(payload)
            
            await websocket.send_json(response)
 
    except WebSocketDisconnect:
        
        logger.info("WebSocket disconnected: %s", websocket.client)
        
    except Exception as exc:
        
        logger.error("Stream error: %s", exc, exc_info=True)
        
    finally:
        # Close the recording session
        
        if recording_id:
            
            async with AsyncSessionLocal() as db:
                
                try:
                    await RecordingService.close(db, recording_id)
                    
                    await db.commit()
                    
                except Exception as exc:
                    
                    logger.error("Failed to close recording: %s", exc)
 
        processor.reset()
        
        logger.info("Stream cleanup complete for recording %s", recording_id)
 
 
#   helpers  
 
def _decode_frame(jpeg_bytes: bytes) -> np.ndarray | None:
    
    """Decode JPEG bytes from WebSocket into a BGR numpy array."""
    buf = np.frombuffer(jpeg_bytes, dtype=np.uint8)
    
    frame = cv2.imdecode(buf, cv2.IMREAD_COLOR)
    
    if frame is None or frame.size == 0:
        
        logger.warning("Received invalid JPEG frame (%d bytes)", len(jpeg_bytes))
        
        return None
    
    return frame
 
 
async def _persist_detection(payload: dict, recording_id: int) -> None:
    """
    Builds a DetectionCreate from the pipeline payload and persists it.
    Runs in its own session to avoid blocking the WebSocket loop.
    """
    async with AsyncSessionLocal() as db:
        try:
            data = DetectionCreate(
                
                recording_id=recording_id,
                detection_type=payload["detection_type"],
                alert_level=payload["alert_level"],
                violence_confidence=payload.get("violence_prob"),
                violence_triggered=payload.get("is_violence", False),
                attention_weights=payload.get("attention"),
                weapons_data=payload.get("_weapons_data"),
                weapon_detected=payload.get("weapon_detected", False),
                pose_data=None,    # skip heavy keypoints for now
                persons_count=payload.get("persons_count"),
                contact_iou=(
                    payload["contact_pairs"][0]["iou"]
                    if payload.get("contact_pairs") else None
                ),
                camera_id=payload.get("camera_id"),
                frame_time=payload["_frame_time_dt"],
                frame_number=payload["frame_number"],
            )
            await DetectionService.create(db, data)
            
            await db.commit()
            
        except Exception as exc:
            
            logger.error("Failed to persist detection: %s", exc)
 
 
async def _persist_event_action(
    action: dict, recording_id: int, current_event_id: int | None,
) -> int | None:
    """
    Applies one AlertConsolidator action to the events table.

    - "open":     create a new Event, return its id.
    - "escalate": bump severity on the open Event.
    - "close":    set ended_at on the open Event, return None.

    Runs in its own session to avoid blocking the WebSocket loop.
    """
    async with AsyncSessionLocal() as db:
        try:
            if action["action"] == "open":
                event = action["event"]
                data = EventCreate(
                    recording_id=recording_id,
                    event_type=event["event_type"],
                    severity=event["severity"],
                    camera_id=event["camera_id"],
                    started_at=event["started_at"],
                )
                created = await EventService.create(db, data)
                await db.commit()
                return created.id

            if action["action"] == "escalate" and current_event_id:
                await EventService.update(
                    db, current_event_id,
                    EventUpdate(severity=action["severity"]),
                )
                await db.commit()
                return current_event_id

            if action["action"] == "close" and current_event_id:
                await EventService.update(
                    db, current_event_id,
                    EventUpdate(ended_at=action["ended_at"]),
                )
                await db.commit()
                return None

        except Exception as exc:
            logger.error("Failed to persist event action: %s", exc)

    return current_event_id


# Enfornce the payload to be sent to the frontend only contains safe fields (no internal data).
def _build_response(payload: dict) -> dict:
    """
    Strips internal fields (prefixed with '_') from the payload.
    Only frontend-safe data is sent through the WebSocket.
    """
    return {
        k: v for k, v in payload.items()
        if not k.startswith("_")
    }
 
 
 