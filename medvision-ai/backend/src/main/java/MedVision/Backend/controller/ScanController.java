package MedVision.Backend.controller;

import MedVision.Backend.dto.ScanDto;
import MedVision.Backend.dto.response.ApiResponse;
import MedVision.Backend.dto.response.ScanResponse;
import MedVision.Backend.service.ScanService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/scans")
@RequiredArgsConstructor
public class ScanController {

    private final ScanService scanService;

    @PostMapping("/upload")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ScanResponse> uploadScan(
            @RequestParam("patientId") Long patientId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "modality", required = false) String modality) throws IOException {
        ScanDto dto = scanService.uploadScan(patientId, file, modality);
        return ApiResponse.success("Scan uploaded successfully", mapToResponse(dto));
    }

    @GetMapping("/{id}")
    public ApiResponse<ScanResponse> getScanById(@PathVariable Long id) {
        ScanDto dto = scanService.getScanById(id);
        return ApiResponse.success("Scan retrieved successfully", mapToResponse(dto));
    }

    @GetMapping
    public ApiResponse<List<ScanResponse>> getAllScans() {
        List<ScanDto> scans = scanService.getAllScans();
        List<ScanResponse> responses = scans.stream().map(this::mapToResponse).collect(Collectors.toList());
        return ApiResponse.success("Scans retrieved successfully", responses);
    }

    @GetMapping("/patient/{patientId}")
    public ApiResponse<List<ScanResponse>> getScansByPatientId(@PathVariable Long patientId) {
        List<ScanDto> scans = scanService.getScansByPatientId(patientId);
        List<ScanResponse> responses = scans.stream().map(this::mapToResponse).collect(Collectors.toList());
        return ApiResponse.success("Patient scans retrieved successfully", responses);
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> getScanFile(@PathVariable Long id) {
        ScanDto dto = scanService.getScanById(id);
        Resource resource = scanService.loadScanFile(id);

        String contentType = "application/octet-stream";
        if (dto.getFileType() != null) {
            String type = dto.getFileType().toLowerCase();
            if (type.equals("jpg") || type.equals("jpeg")) {
                contentType = "image/jpeg";
            } else if (type.equals("png")) {
                contentType = "image/png";
            } else if (type.equals("dcm") || type.equals("dicom")) {
                contentType = "application/dicom";
            }
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + dto.getOriginalFileName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteScan(@PathVariable Long id) {
        scanService.deleteScan(id);
    }

    private ScanResponse mapToResponse(ScanDto dto) {
        ScanResponse response = new ScanResponse();
        response.setId(dto.getId());
        response.setPatientId(dto.getPatientId());
        response.setOriginalFileName(dto.getOriginalFileName());
        response.setFileType(dto.getFileType());
        response.setModality(dto.getModality());
        response.setStatus(dto.getStatus());
        response.setUploadedAt(dto.getUploadedAt());
        return response;
    }
}
