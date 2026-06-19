import logging
from datetime import datetime
 
from app.models.detections import AlertLevel, DetectionType
from app.models.events import EventSeverity, EventType
 
logger = logging.getLogger("aegis.alerts")
 
# Alert matrix:
#   LOW      : contact only
#   MEDIUM   : violence OR weapon
#   HIGH     : violence AND weapon
#   CRITICAL : violence AND weapon AND 3+ persons in contact

 
def compute_alert_level(violence_triggered: bool,
                        weapon_detected: bool,
                        persons_count: int,
                        contact: bool
                        ) -> AlertLevel:
    """
    Single source of truth for the alert severity matrix.
    """
    if violence_triggered and weapon_detected and persons_count >= 3:
        
        return AlertLevel.CRITICAL
    
    if violence_triggered and weapon_detected:
        
        return AlertLevel.HIGH
    
    if violence_triggered or weapon_detected:
        
        return AlertLevel.MEDIUM
    
    if contact:
        
        return AlertLevel.LOW
    
    
    return AlertLevel.LOW
 
 
def compute_detection_type(violence_triggered: bool,
                           weapon_detected: bool,
                           contact: bool
                           ) -> DetectionType:
    """
    Dominant detection type for storage.
    Priority: violence > weapon > contact > normal.
    """
    if violence_triggered:
        
        return DetectionType.VIOLENCE
    
    if weapon_detected:
        
        return DetectionType.WEAPON
    
    if contact:
        
        return DetectionType.CONTACT
    
    return DetectionType.NORMAL
 
 
class AlertConsolidator:
    """
    Turns a stream of per-frame detections into discrete Events.
 
    A new Event opens when an alert condition appears, and closes
    when the condition has been absent for `close_after_frames`
    consecutive frames. One consolidator per WebSocket connection.
    """
 
    def __init__(self, close_after_frames: int = 45):
        
        self.close_after_frames = close_after_frames
        self.open_event: dict | None = None
        self.frames_without_alert = 0
 
    def update(self,
               alert_level: AlertLevel,
               detection_type: DetectionType,
               camera_id: str | None) -> dict | None:
        """
        Feed one frame result. Returns an action dict when an
        Event should be created or closed, otherwise None.
 
        Actions:
          {"action": "open",  "event": {...}}  -> persist new Event
          {"action": "close", "ended_at": dt}  -> set ended_at on the open Event
        """
        is_alert = alert_level in (
            AlertLevel.MEDIUM, AlertLevel.HIGH, AlertLevel.CRITICAL
        )
 
        if is_alert:
            
            self.frames_without_alert = 0
 
            if self.open_event is None:
                
                self.open_event = {
                    "event_type": self._map_event_type(detection_type),
                    "severity":   self._map_severity(alert_level),
                    "camera_id":  camera_id,
                    "started_at": datetime.utcnow(),
                }
                logger.info(
                    "Event opened: %s / %s",
                    self.open_event["event_type"],
                    self.open_event["severity"],
                )
                return {"action": "open", "event": self.open_event}
 
            # Escalate severity of the open event if needed
            new_sev = self._map_severity(alert_level)
            
            if self._severity_rank(new_sev) > self._severity_rank(
                self.open_event["severity"]
            ):
                self.open_event["severity"] = new_sev
                return {"action": "escalate", "severity": new_sev}
 
            return None
 
        # No alert this frame
        if self.open_event is not None:
            
            self.frames_without_alert += 1
            
            if self.frames_without_alert >= self.close_after_frames:
                
                ended = datetime.utcnow()
                
                logger.info("Event closed after %d calm frames",
                            self.close_after_frames)
                self.open_event = None
                
                self.frames_without_alert = 0
                
                return {"action": "close", "ended_at": ended}
 
        return None
 
    def reset(self) -> None:
        self.open_event = None
        self.frames_without_alert = 0
 
    # mapping helpers  
 
    @staticmethod
    def _map_event_type(dt: DetectionType) -> EventType:
        mapping = {
            DetectionType.VIOLENCE: EventType.FIGHT,
            DetectionType.WEAPON:   EventType.WEAPON,
            DetectionType.CONTACT:  EventType.CONTACT,
        }
        return mapping.get(dt, EventType.SYSTEM)
 
    @staticmethod
    def _map_severity(level: AlertLevel) -> EventSeverity:
        mapping = {
            AlertLevel.LOW:      EventSeverity.LOW,
            AlertLevel.MEDIUM:   EventSeverity.MEDIUM,
            AlertLevel.HIGH:     EventSeverity.HIGH,
            AlertLevel.CRITICAL: EventSeverity.CRITICAL,
        }
        return mapping[level]
 
    @staticmethod
    def _severity_rank(sev: EventSeverity) -> int:
        order = {
            EventSeverity.LOW: 0,
            EventSeverity.MEDIUM: 1,
            EventSeverity.HIGH: 2,
            EventSeverity.CRITICAL: 3,
        }
        return order[sev]
 