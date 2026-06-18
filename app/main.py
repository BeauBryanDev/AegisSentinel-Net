from contextlib import asynccontextmanager
 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
 
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.core.session import model_registry
from app.routers import detections, events, health, recordings, stream
 
 
settings = get_settings()
 
 
 
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: configure logging, load ONNX models, run warmup.
    Shutdown: nothing to clean, ONNX releases VRAM on exit.
    """
    setup_logging()
    model_registry.load()
    model_registry.warmup()
    yield
 
 
app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)
 
#   CORS  
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
#   Routers  
app.include_router(health.router)
app.include_router(stream.router)
app.include_router(detections.router)
app.include_router(recordings.router)
app.include_router(events.router)