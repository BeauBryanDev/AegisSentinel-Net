# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AegisSentinel-Net is a real-time security monitoring platform that combines three concurrent ML pipelines:
1. **Violence detection** — ResNet50 + MLP-Attention over 16-frame buffers → ONNX Runtime (GPU)
2. **Weapon detection** — YOLOv11-nano (3 classes: gun, knife, rifle) → ONNX Runtime (GPU)
3. **Pose estimation** — YOLOv11-nano-pose (17 COCO keypoints) → always active, drives HUD skeleton overlay

The inference engine is conditional: pose runs every frame, but the violence model only activates when bounding-box IoU between two detected persons ≥ 0.40 (`contact_iou_threshold`). A 30-frame cooldown prevents redundant inference after contact ends.

## Environment & Deployment

The project runs **entirely in Docker** — no local venv is expected. Python 3.11, CUDA, and all deps are resolved inside the container.

```bash
# Start all services (backend FastAPI + PostgreSQL)
docker-compose up --build -d

# View logs
docker-compose logs -f aegis

# Tear down
docker-compose down
```

Services expose:
- Backend API + Swagger docs: `http://localhost:8000/docs`
- Frontend dev server: `http://localhost:5173` (run separately — frontend is not in docker-compose)
- PostgreSQL: `localhost:5436` (maps to container port 5432)

## Frontend

```bash
cd frontend
npm install
npm run dev      # Vite dev server on :5173
npm run build    # TypeScript check + production build
npm run lint     # ESLint
```

Stack: React 18, TypeScript, Tailwind CSS, Recharts, Zustand, Axios, Vite.

## Backend Structure

```
app/
  core/        — config.py (Settings/pydantic-settings), database.py (async SQLAlchemy engine), security.py, session.py, logging.py
  models/      — SQLAlchemy ORM models (Detection, Event, Recording, User, Weapon)
  schemas/     — Pydantic v2 request/response schemas mirroring models
  routers/     — FastAPI route handlers; stream.py is the WebSocket entry point for live inference
  main.py      — App factory, router registration, lifespan events
script/
  AegisInferenceEngine.py — standalone inference class used by the stream router
  compute_IoU.py          — contact trigger logic
ml/            — ONNX model weights (not committed; .onnx files required at runtime)
sql/           — SQL init scripts auto-run by postgres container on first boot
etl/           — Data pipeline / training utilities
```

## Configuration

Settings are loaded from `.env` via `app/core/config.py` (`Settings` class, `pydantic-settings`). Access settings anywhere via `get_settings()` (LRU-cached singleton). Required env vars:

```
SECRET_KEY, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, DATABASE_URL
```

Model paths default to `ml_models/aegis_sentinel.onnx`, `ml_models/yolov11_nano_pose.onnx`, `ml_models/yolov8_nano_weapons.onnx`. In production mode, missing model files raise a `ValueError` at startup.

## Database

- Async SQLAlchemy 2.0 with `asyncpg` driver
- Session lifecycle is managed in `app/core/database.py` via `get_db()` async generator (commit on success, rollback on exception)
- `create_all_tables()` / `drop_all_tables()` are test-only helpers — production schema is managed via the SQL init scripts in `sql/`
- ORM models: `Detection` (primary event store with JSONB columns for `attention_weights`, `weapons_data`, `pose_data`), `Event`, `Recording`, `User`

## Key Inference Flow

WebSocket frame → YOLOv11-pose → contact IoU check → `AegisInferenceEngine.add_frame()` → optional ONNX forward pass → JSON response to frontend:

```json
{
  "persons": [{"id", "bbox", "keypoints", "skeleton_color"}],
  "contact_pairs": [{"person_a", "person_b", "iou"}],
  "trigger_active": bool,
  "violence_prob": float | null,
  "alert_level": "NORMAL" | "CONTACT" | "FIGHT",
  "attention": [16 floats] | null
}
```

Alert levels stored in DB: `LOW` (contact only) → `MEDIUM` (violence OR weapon) → `HIGH` (violence + weapon) → `CRITICAL` (violence + weapon + multiple contacts).

## Hardware Requirement

NVIDIA GPU with CUDA is **mandatory** for live inference. ONNX sessions request `CUDAExecutionProvider` first, fall back to CPU. The docker-compose GPU reservation assumes NVIDIA Container Toolkit is installed on the host.
