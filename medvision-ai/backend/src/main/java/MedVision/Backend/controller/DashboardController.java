package MedVision.Backend.controller;

import MedVision.Backend.dto.response.ApiResponse;
import MedVision.Backend.dto.response.DashboardSummaryResponse;
import MedVision.Backend.repository.AIAnalysisRepository;
import MedVision.Backend.repository.AnalysisJobRepository;
import MedVision.Backend.repository.PatientRepository;
import MedVision.Backend.repository.ScanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final PatientRepository patientRepository;
    private final ScanRepository scanRepository;
    private final AIAnalysisRepository aiAnalysisRepository;
    private final AnalysisJobRepository analysisJobRepository;

    @GetMapping("/summary")
    public ApiResponse<DashboardSummaryResponse> getDashboardSummary() {
        long totalPatients = patientRepository.count();
        long totalScans = scanRepository.count();
        long completedAnalyses = aiAnalysisRepository.count();

        // Jobs in progress (not completed or failed)
        long processingAnalyses = analysisJobRepository.findAll().stream()
                .filter(job -> !"COMPLETED".equalsIgnoreCase(job.getStatus()) && !"FAILED".equalsIgnoreCase(job.getStatus()))
                .count();

        // Count reviews required (tumorDetected == true)
        long reviewRequired = aiAnalysisRepository.findAll().stream()
                .filter(a -> Boolean.TRUE.equals(a.getTumorDetected()))
                .count();

        DashboardSummaryResponse summary = DashboardSummaryResponse.builder()
                .totalPatients(totalPatients)
                .totalScans(totalScans)
                .processingAnalyses(processingAnalyses)
                .completedAnalyses(completedAnalyses)
                .reviewRequired(reviewRequired)
                .build();

        return ApiResponse.success("Dashboard summary retrieved successfully", summary);
    }
}
