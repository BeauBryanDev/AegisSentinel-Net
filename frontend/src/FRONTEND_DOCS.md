```
frontend/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── routes.tsx
    ├── styles.css
    ├── vite-env.d.ts
    ├── assets/
    │   └── safety-svgrepo-com.svg
    ├── components/
    │   ├── alerts/
    │   │   ├── AlertItem.tsx
    │   │   └── AlertList.tsx
    │   ├── charts/
    │   │   ├── BarChart.tsx
    │   │   ├── GaugeChart.tsx
    │   │   ├── MetricsBar.tsx
    │   │   └── PieChart.tsx
    │   ├── dashboard/
    │   │   ├── KPICard.tsx
    │   │   ├── ThreatLevelGauge.tsx
    │   │   ├── RecentThreats.tsx
    │   │   ├── SystemFeed.tsx
    │   │   └── VisionModels.tsx
    │   ├── layout/
    │   │   ├── nav.tsx
    │   │   ├── Header.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── BottomNav.tsx
    │   │   ├── Footer.tsx
    │   │   └── SectionContainer.tsx
    │   ├── stream/
    │   │   ├── VideoCanvas.tsx
    │   │   ├── DetectionOverlay.tsx
    │   │   ├── StreamControls.tsx
    │   │   └── PeopleCounter.tsx
    │   └── ui/
    │       ├── Badge.tsx
    │       └── CyberButton.tsx
    ├── hooks/
    │   ├── useDetections.ts
    │   ├── useSocket.ts
    │   └── useStream.ts
    ├── layouts/
    │   ├── ProtectedLayout.tsx
    │   └── PublicLayout.tsx
    ├── pages/
    │   ├── Dashboard.tsx
    │   ├── LiveStream.tsx
    │   ├── Detections.tsx
    │   ├── WeaponsHistory.tsx
    │   ├── Reports.tsx
    │   ├── Metrics.tsx
    │   ├── Alerts.tsx
    │   ├── SystemLogs.tsx
    │   ├── Settings.tsx
    │   ├── Login.tsx
    │   └── NotFound.tsx
    ├── services/
    │   ├── api.ts
    │   └── ws.ts
    ├── stores/
    │   ├── useStreamStore.ts
    │   └── useAlertStore.ts
    └── types/   
        ├── index.ts   // ALL TYPES 
        ├── detections.ts // REST: Detections
        ├── alerts.ts // REST: Events (alerts/incidents)
        ├── metrics.ts // REST: Health and metrics
        ├── stream.ts // WebSocket stream (real-time inference)
        └── pose.ts // Pose constants

src/routes.tsx
│
├── PublicLayout (public routes)
|   |  /Home (hero, fullscreen, NO nav)
│   ├── / (Login)
│   └── /register (optional)
│
└── ProtectedLayout (protected routes)
    ├── /dashboard
    ├── /live
    ├── /detections
    ├── /weapons
    ├── /reports
    ├── /metrics
    ├── /alerts
    ├── /logs
    ├── /settings
    └── /not-found


/             -> Home (hero, fullscreen, NO nav)
/login        -> Login (placeholder)
/signup       -> SignUp (placeholder)
/dashboard    -> Dashboard (con Header + Sidebar/BottomNav)
/stream       -> LiveStream

**Stream Payload tha comes to frontend**

{
  frame_number:         int
  frame_time:           ISO string
  camera_id:            string

  persons:              [???]      // PoseService.detect()
  persons_count:        int
  contact:              bool
  contact_pairs:        [???]      // PoseService.detect()

  weapon_detected:      bool
  weapons:              [???]      // WeaponService.detect()

  engine_awake:         bool
  violence_prob:        float | null
  is_violence:          bool
  attention:            float[] | null

  alert_level:          "low" | "medium" | "high" | "critical"
  detection_type:       "violence" | "weapon" | "contact" | "normal"
  violence_prob_smooth: float | null
}


**Types Interfaces**

types/stream.ts      <-->  StreamProcessor.process_frame() + _build_response()
  FramePayload             JSON que viaja por WebSocket cada frame
  PersonDetection          PoseService.detect() -> persons[i]
  ContactPair              check_contact_trigger() -> contact_pairs[i]
  WeaponDetection          WeaponService.detect() -> weapons[i]
  AlertLevel               app/models/detections.py enum
  DetectionType             app/models/detections.py enum

types/detections.ts  <-->  app/schemas/detections.py
  DetectionRead            GET /api/v1/detections/:id (full)
  DetectionSummary         GET /api/v1/detections/ (lightweight list)
  WeaponsDataMap           weapons_data JSONB column

types/alerts.ts      <-->  app/schemas/events.py
  EventRead                GET /api/v1/events/, PATCH
  EventUpdate              PATCH /api/v1/events/:id body
  EventType, EventSeverity app/models/events.py enums

types/recordings.ts  <-->  app/schemas/recordings.py
  RecordingRead            GET /api/v1/recordings/
  RecordingWithStats       GET /api/v1/recordings/:id (with counters)

types/metrics.ts     <-->  app/routers/health.py
  HealthResponse           GET /api/v1/health

types/pose.ts        <-->  PoseService (COCO 17 keypoints)
  COCO_KEYPOINTS           label array for UI overlays
  SKELETON_CONNECTIONS     limb pairs for drawing skeleton on canvas

**Interceptro in src/services/api.ts Axios Clients**

getHealth()                     -> GET /api/v1/health
listDetections(params?)         -> GET /api/v1/detections/
getDetection(id)                -> GET /api/v1/detections/:id
listEvents(params?)             -> GET /api/v1/events/
getEvent(id)                    -> GET /api/v1/events/:id
updateEvent(id, body)           -> PATCH /api/v1/events/:id
listRecordings(params?)         -> GET /api/v1/recordings/
getRecording(id)                -> GET /api/v1/recordings/:id

**WebSocket**
ws.connect()                    -> ws://localhost:8000/ws/stream

**Stream Payload**
FramePayload                    JSON cada frame

**LiveStream Pipeline**

getUserMedia (back camera )
  -> canvas.drawImage(video)
  -> canvas.toBlob("image/jpeg", quality)
  -> socket.sendFrame(blob)
  -> backend procesa (pose + weapons + violence)
  -> socket.onFrame(payload)
  -> Zustand store actualiza
  -> DetectionOverlay dibuja boxes/skeletons sobre el canvas
