import os
import pydicom
from app.services.dicom_service import dicom_service


def test_dicom_conversion_jpg(tmp_path, sample_jpeg_bytes):
    # Create temp jpg file
    jpg_file = tmp_path / "sample.jpg"
    jpg_file.write_bytes(sample_jpeg_bytes)

    result = dicom_service.convert_image_to_derived_dicom(str(jpg_file), "sample.jpg")

    assert result["success"] is True
    assert os.path.exists(result["dicom_path"])
    assert result["original_file_name"] == "sample.jpg"
    assert result["modality"] == "SC"

    # Verify readable with pydicom
    ds = pydicom.dcmread(result["dicom_path"])
    assert ds.SOPClassUID == "1.2.840.10008.5.1.4.1.1.7"  # Secondary Capture
    assert ds.Rows == 100
    assert ds.Columns == 100


def test_dicom_conversion_png(tmp_path, sample_png_bytes):
    png_file = tmp_path / "scan_brain.png"
    png_file.write_bytes(sample_png_bytes)

    result = dicom_service.convert_image_to_derived_dicom(str(png_file), "scan_brain.png")

    assert result["success"] is True
    assert os.path.exists(result["dicom_path"])
    
    ds = pydicom.dcmread(result["dicom_path"])
    assert ds.Rows == 128
    assert ds.Columns == 128
