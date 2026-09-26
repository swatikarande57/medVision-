package MedVision.Backend.service;

import MedVision.Backend.dto.request.ComparisonRequest;
import MedVision.Backend.dto.response.ComparisonResponse;

import java.util.List;

public interface ComparisonService {
    List<ComparisonResponse> getComparisonsByPatientId(Long patientId);
    ComparisonResponse createComparison(ComparisonRequest request);
}
