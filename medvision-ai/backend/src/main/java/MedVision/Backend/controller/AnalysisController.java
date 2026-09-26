package MedVision.Backend.controller;

import MedVision.Backend.dto.request.JobRequest;
import MedVision.Backend.dto.response.AnalysisResponse;
import MedVision.Backend.dto.response.ApiResponse;
import MedVision.Backend.dto.response.JobResponse;
import MedVision.Backend.entity.AIAnalysis;
import MedVision.Backend.exception.ResourceNotFoundException;
import MedVision.Backend.repository.AIAnalysisRepository;
import MedVision.Backend.service.AnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;
    private final AIAnalysisRepository aiAnalysisRepository;

    @GetMapping("/{id}")
    public ApiResponse<AnalysisResponse> getAnalysisById(@PathVariable Long id) {
        AnalysisResponse response = analysisService.getAnalysisById(id);
        return ApiResponse.success("Analysis retrieved successfully", response);
    }

    @GetMapping("/scan/{scanId}")
    public ApiResponse<AnalysisResponse> getAnalysisByScanId(@PathVariable Long scanId) {
        AnalysisResponse response = analysisService.getAnalysisByScanId(scanId);
        return ApiResponse.success("Analysis retrieved successfully", response);
    }

    @GetMapping("/patient/{patientId}")
    public ApiResponse<List<AnalysisResponse>> getAnalysesByPatientId(@PathVariable Long patientId) {
        List<AnalysisResponse> response = analysisService.getAnalysesByPatientId(patientId);
        return ApiResponse.success("Patient analyses retrieved successfully", response);
    }

    @PostMapping("/jobs")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ApiResponse<JobResponse> createAnalysisJob(@Valid @RequestBody JobRequest request) {
        JobResponse response = analysisService.createAnalysisJob(request.getScanId());
        return ApiResponse.success("Analysis job created successfully", response);
    }

    @GetMapping("/jobs/{jobId}")
    public ApiResponse<JobResponse> getJobById(@PathVariable Long jobId) {
        JobResponse response = analysisService.getJobById(jobId);
        return ApiResponse.success("Analysis job status retrieved successfully", response);
    }

    /**
     * Serves the AI-generated overlay PNG for a given scan.
     * The overlay image is stored on disk by the FastAPI service and referenced in AIAnalysis.overlayPath.
     * Path is sanitized to prevent arbitrary filesystem access.
     */
    @GetMapping("/scan/{scanId}/overlay")
    public ResponseEntity<Resource> getScanOverlay(@PathVariable Long scanId) {
        AIAnalysis analysis = aiAnalysisRepository.findByScanId(scanId)
                .orElseThrow(() -> new ResourceNotFoundException("No analysis found for scanId: " + scanId));

        String overlayPath = analysis.getOverlayPath();
        if (overlayPath == null || overlayPath.isBlank()) {
            throw new ResourceNotFoundException("No overlay generated for scanId: " + scanId);
        }

        return serveFile(overlayPath, "image/png", "overlay_scan_" + scanId + ".png");
    }

    /**
     * Serves the AI-generated segmentation mask file for a given scan.
     * The mask is a 3D NumPy array (.npy) stored on disk by the FastAPI service.
     */
    @GetMapping("/scan/{scanId}/mask")
    public ResponseEntity<Resource> getScanMask(@PathVariable Long scanId) {
        AIAnalysis analysis = aiAnalysisRepository.findByScanId(scanId)
                .orElseThrow(() -> new ResourceNotFoundException("No analysis found for scanId: " + scanId));

        String maskPath = analysis.getMaskPath();
        if (maskPath == null || maskPath.isBlank()) {
            throw new ResourceNotFoundException("No mask generated for scanId: " + scanId);
        }

        return serveFile(maskPath, "application/octet-stream", "mask_scan_" + scanId + ".npy");
    }

    /**
     * Securely serves a file from the filesystem with path validation.
     */
    private ResponseEntity<Resource> serveFile(String filePath, String contentType, String downloadName) {
        try {
            Path path = Paths.get(filePath).toAbsolutePath().normalize();
            Resource resource = new UrlResource(path.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("Generated file not found on disk: " + downloadName);
            }

            log.info("[AnalysisController] Serving file: {}", path);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + downloadName + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                    .body(resource);

        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Invalid file path: " + filePath);
        }
    }
}
