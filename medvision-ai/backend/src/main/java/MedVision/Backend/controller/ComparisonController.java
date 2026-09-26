package MedVision.Backend.controller;

import MedVision.Backend.dto.request.ComparisonRequest;
import MedVision.Backend.dto.response.ApiResponse;
import MedVision.Backend.dto.response.ComparisonResponse;
import MedVision.Backend.service.ComparisonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comparisons")
@RequiredArgsConstructor
public class ComparisonController {

    private final ComparisonService comparisonService;

    @GetMapping("/patient/{patientId}")
    public ApiResponse<List<ComparisonResponse>> getComparisonsByPatientId(@PathVariable Long patientId) {
        List<ComparisonResponse> responses = comparisonService.getComparisonsByPatientId(patientId);
        return ApiResponse.success("Patient comparisons retrieved successfully", responses);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ComparisonResponse> createComparison(@Valid @RequestBody ComparisonRequest request) {
        ComparisonResponse response = comparisonService.createComparison(request);
        return ApiResponse.success("Longitudinal comparison generated successfully", response);
    }
}
