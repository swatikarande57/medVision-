package MedVision.Backend.controller;

import MedVision.Backend.dto.request.ReportRequest;
import MedVision.Backend.dto.response.ApiResponse;
import MedVision.Backend.dto.response.ReportResponse;
import MedVision.Backend.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping
    public ApiResponse<List<ReportResponse>> getAllReports() {
        List<ReportResponse> reports = reportService.getAllReports();
        return ApiResponse.success("Reports retrieved successfully", reports);
    }

    @GetMapping("/{id}")
    public ApiResponse<ReportResponse> getReportById(@PathVariable Long id) {
        ReportResponse report = reportService.getReportById(id);
        return ApiResponse.success("Report retrieved successfully", report);
    }

    @GetMapping("/patient/{patientId}")
    public ApiResponse<List<ReportResponse>> getReportsByPatientId(@PathVariable Long patientId) {
        List<ReportResponse> reports = reportService.getReportsByPatientId(patientId);
        return ApiResponse.success("Patient reports retrieved successfully", reports);
    }

    @GetMapping("/scan/{scanId}")
    public ApiResponse<List<ReportResponse>> getReportsByScanId(@PathVariable Long scanId) {
        List<ReportResponse> reports = reportService.getReportsByScanId(scanId);
        return ApiResponse.success("Scan reports retrieved successfully", reports);
    }

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ReportResponse> generateReport(@Valid @RequestBody ReportRequest request) {
        ReportResponse report = reportService.generateReport(request);
        return ApiResponse.success("Report generated successfully", report);
    }
}
