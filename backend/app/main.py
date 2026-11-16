"""RosterIQ Backend FastAPI Application."""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.core.database import Base, engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rosteriq")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up RosterIQ backend service...")
    try:
        # Create tables automatically if they don't exist
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified.")
    except Exception as e:
        logger.warning(f"Could not connect to database on startup (may need migration/env config): {e}")
    yield
    logger.info("Shutting down RosterIQ backend service...")


app = FastAPI(
    title=settings.APP_NAME,
    description="Smart Workforce & Roster Management System for DATASTRAW Operations",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS setup: allows development origins and any deployed *.onrender.com frontend domain
cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
if "*" in cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=r"https://.*\.onrender\.com",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register API routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT
    }


@app.get("/api/v1/health")
def api_health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "api_version": "v1"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
