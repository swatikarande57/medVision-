from fastapi import FastAPI

from app.config import settings

app = FastAPI(
    title=settings.app_name,
    description="MedVision AI — preprocessing and inference service (bootstrap)",
    version="0.1.0",
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": settings.app_name,
        "gpu_available": False,
        "device": settings.inference_device,
        "models_loaded": [],
    }


@app.get("/")
def root():
    return {"message": "MedVision AI Service", "docs": "/docs"}
