package MedVision.Backend.service;

import MedVision.Backend.dto.response.AnalysisResponse;
import MedVision.Backend.dto.response.JobResponse;

import java.util.List;

public interface AnalysisService {
    AnalysisResponse getAnalysisById(Long id);
    AnalysisResponse getAnalysisByScanId(Long scanId);
    List<AnalysisResponse> getAnalysesByPatientId(Long patientId);

    JobResponse createAnalysisJob(Long scanId);
    JobResponse getJobById(Long jobId);
}
