package MedVision.Backend.service;

import MedVision.Backend.dto.ScanDto;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface ScanService {
    ScanDto uploadScan(Long patientId, MultipartFile file, String modality) throws IOException;
    ScanDto getScanById(Long id);
    List<ScanDto> getAllScans();
    List<ScanDto> getScansByPatientId(Long patientId);
    org.springframework.core.io.Resource loadScanFile(Long id);
    void deleteScan(Long id);
}
