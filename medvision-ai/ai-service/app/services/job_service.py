import asyncio
import uuid
from typing import Dict
from app.inference.model import get_inference_model
from app.schemas.analysis import JobStatusResponse, JobStage, InferenceResult
from app.utils.logging import logger


class JobManager:
    """
    In-memory asynchronous job manager.
    Tracks job status transitions without blocking HTTP endpoints.
    """

    def __init__(self):
        self._jobs: Dict[str, JobStatusResponse] = {}

    def create_job(self) -> str:
        """Generates a unique jobId and registers initial QUEUED status."""
        job_id = f"job_{uuid.uuid4().hex[:12]}"
        self._jobs[job_id] = JobStatusResponse(
            jobId=job_id,
            status="QUEUED",
            progress=0,
            stage="QUEUED",
            error=None,
            result=None
        )
        logger.info(f"Registered new AI analysis job #{job_id}")
        return job_id

    def get_job_status(self, job_id: str) -> JobStatusResponse | None:
        """Retrieves current job status response by jobId."""
        return self._jobs.get(job_id)

    def _update_stage(self, job_id: str, status: JobStage, progress: int, stage_desc: str):
        """Internal helper to update job state telemetry."""
        if job_id in self._jobs:
            self._jobs[job_id].status = status
            self._jobs[job_id].progress = progress
            self._jobs[job_id].stage = stage_desc
            logger.info(f"[Job #{job_id}] -> {status} ({progress}%) - {stage_desc}")

    async def run_async_pipeline(self, job_id: str, file_path: str):
        """
        Executes non-blocking background analysis pipeline across defined stages:
        QUEUED -> VALIDATING -> PREPROCESSING -> INFERENCE -> SEGMENTATION -> POST_PROCESSING -> COMPLETED/FAILED
        """
        try:
            # 1. VALIDATING
            self._update_stage(job_id, "VALIDATING", 15, "Validating file integrity and format")
            await asyncio.sleep(0.05)

            # 2. PREPROCESSING
            self._update_stage(job_id, "PREPROCESSING", 35, "Running image normalization and tensor conversion")
            await asyncio.sleep(0.05)

            # 3. INFERENCE
            self._update_stage(job_id, "INFERENCE", 60, "Executing SegResNet neural model forward pass")

            model = get_inference_model()
            # Run CPU-bound inference in thread pool so event loop remains responsive to polling
            inference_result: InferenceResult = await asyncio.to_thread(model.predict, file_path, job_id)

            # 4. SEGMENTATION
            self._update_stage(job_id, "SEGMENTATION", 85, "Generating segmentation sub-region layers & overlays")

            # 5. POST_PROCESSING
            self._update_stage(job_id, "POST_PROCESSING", 95, "Compiling metrics & postprocessing telemetry")

            # 6. COMPLETED
            if job_id in self._jobs:
                self._jobs[job_id].status = "COMPLETED"
                self._jobs[job_id].progress = 100
                self._jobs[job_id].stage = "Processing complete"
                self._jobs[job_id].result = inference_result
                logger.info(f"[Job #{job_id}] Successfully finished analysis pipeline. Status: {inference_result.status}")


        except Exception as e:
            logger.error(f"[Job #{job_id}] Pipeline execution failed: {str(e)}", exc_info=True)
            if job_id in self._jobs:
                self._jobs[job_id].status = "FAILED"
                self._jobs[job_id].progress = 0
                self._jobs[job_id].stage = "Pipeline execution failed"
                self._jobs[job_id].error = str(e)


job_manager = JobManager()
