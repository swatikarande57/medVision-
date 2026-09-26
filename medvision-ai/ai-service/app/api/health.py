from fastapi import APIRouter
from app.config import settings
from app.schemas.common import HealthResponse

router = APIRouter(prefix="/api/ai", tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def get_health():
    """
    Lightweight health check endpoint.
    Verifies service process status without loading the heavy AI model.
    """
    return HealthResponse(
        status="UP",
        service=settings.SERVICE_NAME,
        version=settings.VERSION,
        modelMode=settings.AI_MODE.upper(),
        device=settings.resolve_device()
    )
