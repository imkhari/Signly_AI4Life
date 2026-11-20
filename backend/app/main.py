import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.rest.dev import router as dev_router
from app.api.rest.health import router as health_router
from app.api.rest.ontology import router as ontology_router
from app.api.rest.sessions import router as sessions_router
from app.api.rest.vsl import clear_vsl_motion_buffer
from app.api.rest.vsl import router as vsl_router
from app.api.ws.hub import manager
from app.api.ws.hub import router as ws_router
from app.application.abandoned_sessions import AbandonedSessions, run_abandoned_cleanup
from app.config import settings
from app.infrastructure.session_store_memory import session_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    cleaner = AbandonedSessions(session_store, manager, settings.SESSION_IDLE_MINUTES * 60)
    task = asyncio.create_task(run_abandoned_cleanup(cleaner))
    try:
        yield
    finally:
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task
        clear_vsl_motion_buffer()


app = FastAPI(
    lifespan=lifespan,
    title="AI4Care Backend API",
    description="Multimodal Triage Assistant for Deaf & Speech-Impaired Patients",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"^https?://.*$" if settings.ENV in ("dev", "demo") else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST Routers
app.include_router(health_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")
app.include_router(ontology_router, prefix="/api")
app.include_router(vsl_router, prefix="/api")
app.include_router(dev_router, prefix="/api")

# WebSocket Router
app.include_router(ws_router)
