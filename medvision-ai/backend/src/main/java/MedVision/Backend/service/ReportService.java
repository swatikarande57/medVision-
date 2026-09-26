package MedVision.Backend.service;

import MedVision.Backend.dto.request.ReportRequest;
import MedVision.Backend.dto.response.ReportResponse;

import java.util.List;

public interface ReportService {
    List<ReportResponse> getAllReports();
    ReportResponse getReportById(Long id);
    List<ReportResponse> getReportsByPatientId(Long patientId);
    List<ReportResponse> getReportsByScanId(Long scanId);
    ReportResponse generateReport(ReportRequest request);
}
