from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.api import health, analysis
from app.inference.model import get_inference_model
from app.utils.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for application startup and shutdown events."""
    logger.info(f"Starting {settings.SERVICE_NAME} v{settings.VERSION} (AI_MODE={settings.AI_MODE.upper()}, DEVICE={settings.resolve_device()})")
    if settings.AI_MODE.lower() == "production":
        try:
            logger.info("Pre-loading MONAI model weights during startup...")
            model = get_inference_model()
            model.validate_model()
        except Exception as e:
            logger.error(f"Failed to pre-load production MONAI model on startup: {str(e)}")
    yield
    logger.info("Shutting down MedVision AI service.")


app = FastAPI(
    title=settings.SERVICE_NAME,
    version=settings.VERSION,
    description="MedVision AI Medical Image Processing & Neural Inference FastAPI Service",
    lifespan=lifespan
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production security domain constraints
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(health.router)
app.include_router(analysis.router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on path {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": f"An internal server error occurred: {str(exc)}",
            "code": "INTERNAL_SERVER_ERROR"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
