import os
import datetime
import numpy as np
from PIL import Image
import pydicom
from pydicom.dataset import Dataset, FileDataset, FileMetaDataset
from pydicom.uid import ExplicitVRLittleEndian, generate_uid, SecondaryCaptureImageStorage
from app.storage.file_storage import file_storage
from app.utils.logging import logger


class DicomService:
    """Service to derive Secondary Capture DICOM objects from standard images (JPG/PNG)."""

    def convert_image_to_derived_dicom(
        self, image_path: str, original_filename: str | None = None
    ) -> dict:
        """
        Converts an image file (JPG/PNG) into a compliant Secondary Capture DICOM dataset.
        Ensures NO fake acquisition parameters (TR/TE/SliceThickness) are fabricated.
        Validates output by reading back with pydicom.dcmread().
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Source image file not found: {image_path}")

        orig_name = original_filename or os.path.basename(image_path)
        img = Image.open(image_path).convert("L")  # Convert to Grayscale 8-bit
        img_np = np.array(img, dtype=np.uint8)

        height, width = img_np.shape

        # 1. Create File Meta Information
        file_meta = FileMetaDataset()
        file_meta.MediaStorageSOPClassUID = SecondaryCaptureImageStorage
        file_meta.MediaStorageSOPInstanceUID = generate_uid()
        file_meta.TransferSyntaxUID = ExplicitVRLittleEndian

        # 2. Create File Dataset
        filename_base = f"DERIVED_{file_meta.MediaStorageSOPInstanceUID}.dcm"
        target_dicom_path = file_storage.get_dicom_path(filename_base)

        ds = FileDataset(target_dicom_path, {}, file_meta=file_meta, preamble=b"\x00" * 128)

        # 3. Required Patient / Study / Series Identification
        now = datetime.datetime.now()
        ds.PatientName = "DERIVED^PATIENT"
        ds.PatientID = "DERIVED-PATIENT-001"
        ds.PatientBirthDate = ""
        ds.PatientSex = "O"

        ds.StudyInstanceUID = generate_uid()
        ds.SeriesInstanceUID = generate_uid()
        ds.SOPInstanceUID = file_meta.MediaStorageSOPInstanceUID
        ds.SOPClassUID = SecondaryCaptureImageStorage

        ds.StudyDate = now.strftime("%Y%m%d")
        ds.StudyTime = now.strftime("%H%M%S")
        ds.AccessionNumber = ""
        ds.Modality = "SC"  # Secondary Capture

        ds.StudyDescription = f"Derived Secondary Capture from {orig_name}"
        ds.SeriesDescription = "MedVision Derived DICOM Conversion"
        ds.ConversionType = "WSD"  # Workstation

        # 4. Image Pixel Module Elements
        ds.SamplesPerPixel = 1
        ds.PhotometricInterpretation = "MONOCHROME2"
        ds.Rows = height
        ds.Columns = width
        ds.BitsAllocated = 8
        ds.BitsStored = 8
        ds.HighBit = 7
        ds.PixelRepresentation = 0
        ds.PixelData = img_np.tobytes()

        # Set compliant endianness flags
        ds.is_little_endian = True
        ds.is_implicit_VR = False

        # Save DICOM file
        ds.save_as(target_dicom_path, write_like_original=False)
        logger.info(f"Derived DICOM file created: {target_dicom_path}")

        # 5. Verify Readability with pydicom.dcmread
        verified_ds = pydicom.dcmread(target_dicom_path)
        
        return {
            "success": True,
            "dicom_path": target_dicom_path,
            "original_file_name": orig_name,
            "sop_instance_uid": str(verified_ds.SOPInstanceUID),
            "modality": verified_ds.Modality,
            "rows": verified_ds.Rows,
            "columns": verified_ds.Columns
        }


dicom_service = DicomService()
