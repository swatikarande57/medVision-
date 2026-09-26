from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, status
from fastapi.responses import FileResponse
from app.schemas.analysis import (
    JobSubmissionResponse,
    JobStatusResponse,
    DicomConversionResponse
)
from app.services.image_service import image_service
from app.services.dicom_service import dicom_service
from app.services.job_service import job_manager
from app.storage.file_storage import file_storage
from app.utils.validation import ImageValidationError
from app.utils.logging import logger
import os

router = APIRouter(prefix="/api/ai", tags=["AI Analysis"])


@router.post("/jobs", response_model=JobSubmissionResponse, status_code=status.HTTP_202_ACCEPTED)
async def submit_analysis_job(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Asynchronous job submission endpoint.
    Validates uploaded image and returns jobId immediately with QUEUED status.
    Executes AI pipeline non-blocking in background tasks.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required image file parameter."
        )

    try:
        content = await file.read()
        
        # 1. Validate image & save to storage
        saved_metadata = image_service.process_and_save_upload(content, file.filename)
        saved_path = saved_metadata["file_path"]

        # 2. Create job in JobManager
        job_id = job_manager.create_job()

        # 3. Dispatch non-blocking background task
        background_tasks.add_task(job_manager.run_async_pipeline, job_id, saved_path)

        return JobSubmissionResponse(jobId=job_id, status="QUEUED")

    except ImageValidationError as ve:
        logger.warning(f"Image validation rejected upload '{file.filename}': {str(ve)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error during job submission: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit analysis job: {str(e)}"
        )


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
def get_job_status(job_id: str):
    """
    Job status polling endpoint.
    Returns status (QUEUED, VALIDATING, PREPROCESSING, INFERENCE, SEGMENTATION, COMPLETED, FAILED),
    progress percentage, current stage, and result.
    """
    job_info = job_manager.get_job_status(job_id)
    if not job_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job #{job_id} not found."
        )
    return job_info


@router.get("/files/{file_type}/{filename}")
def get_generated_file(file_type: str, filename: str):
    """
    Secure file-serving endpoint for generated overlay PNGs and mask NPY files.
    file_type must be 'overlays' or 'masks'.
    Filename must be a simple basename (no path traversal).
    """
    if file_type not in ("overlays", "masks"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Must be 'overlays' or 'masks'."
        )

    # Sanitize filename — only allow simple basenames
    safe_name = os.path.basename(filename)
    if safe_name != filename or ".." in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename."
        )

    if file_type == "overlays":
        file_path = os.path.join(file_storage.overlays_dir, safe_name)
        media_type = "image/png"
    else:
        file_path = os.path.join(file_storage.masks_dir, safe_name)
        media_type = "application/octet-stream"

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File not found: {safe_name}"
        )

    return FileResponse(file_path, media_type=media_type, filename=safe_name)


@router.post("/dicom/convert", response_model=DicomConversionResponse)
async def convert_to_dicom(file: UploadFile = File(...)):
    """
    Derived Secondary Capture DICOM conversion endpoint using pydicom.
    Converts JPG/PNG into a Secondary Capture DICOM object with valid UIDs.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required image file parameter."
        )

    try:
        content = await file.read()
        saved_metadata = image_service.process_and_save_upload(content, file.filename)
        saved_path = saved_metadata["file_path"]

        # Convert to Secondary Capture DICOM
        result = dicom_service.convert_image_to_derived_dicom(saved_path, file.filename)

        return DicomConversionResponse(
            success=True,
            dicomPath=result["dicom_path"],
            originalFileName=result["original_file_name"],
            sopInstanceUid=result["sop_instance_uid"],
            modality=result["modality"],
            message="Successfully converted image to derived Secondary Capture DICOM format."
        )

    except ImageValidationError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed DICOM conversion for '{file.filename}': {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"DICOM conversion failed: {str(e)}"
        )
