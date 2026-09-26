from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "UP"
    service: str = "medvision-ai"
    version: str = "2.4.0"
    modelMode: str  # DEMO or PRODUCTION
    device: str     # CPU or CUDA


class ErrorResponse(BaseModel):
    detail: str
    code: str = "ERROR"
