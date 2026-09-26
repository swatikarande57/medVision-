package MedVision.Backend.service.impl;

import MedVision.Backend.dto.request.ReportRequest;
import MedVision.Backend.dto.response.ReportResponse;
import MedVision.Backend.entity.AIAnalysis;
import MedVision.Backend.entity.Patient;
import MedVision.Backend.entity.Report;
import MedVision.Backend.entity.Scan;
import MedVision.Backend.exception.ResourceNotFoundException;
import MedVision.Backend.repository.AIAnalysisRepository;
import MedVision.Backend.repository.PatientRepository;
import MedVision.Backend.repository.ReportRepository;
import MedVision.Backend.repository.ScanRepository;
import MedVision.Backend.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final PatientRepository patientRepository;
    private final ScanRepository scanRepository;
    private final AIAnalysisRepository aiAnalysisRepository;

    @Override
    public List<ReportResponse> getAllReports() {
        return reportRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ReportResponse getReportById(Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id));
        return mapToResponse(report);
    }

    @Override
    public List<ReportResponse> getReportsByPatientId(Long patientId) {
        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient not found with id: " + patientId);
        }
        return reportRepository.findByPatientId(patientId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ReportResponse> getReportsByScanId(Long scanId) {
        if (!scanRepository.existsById(scanId)) {
            throw new ResourceNotFoundException("Scan not found with id: " + scanId);
        }
        return reportRepository.findByScanId(scanId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ReportResponse generateReport(ReportRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + request.getPatientId()));
        Scan scan = scanRepository.findById(request.getScanId())
                .orElseThrow(() -> new ResourceNotFoundException("Scan not found with id: " + request.getScanId()));

        AIAnalysis analysis = null;
        if (request.getAnalysisId() != null) {
            analysis = aiAnalysisRepository.findById(request.getAnalysisId()).orElse(null);
        }

        Report report = new Report();
        report.setPatient(patient);
        report.setScan(scan);
        report.setAnalysis(analysis);
        report.setReportPath("/reports/report_" + scan.getId() + "_" + UUID.randomUUID().toString().substring(0, 8) + ".pdf");

        Report savedReport = reportRepository.save(report);
        return mapToResponse(savedReport);
    }

    private ReportResponse mapToResponse(Report report) {
        ReportResponse response = new ReportResponse();
        response.setId(report.getId());
        response.setPatientId(report.getPatient().getId());
        response.setScanId(report.getScan().getId());
        response.setAnalysisId(report.getAnalysis() != null ? report.getAnalysis().getId() : null);
        response.setReportPath(report.getReportPath());
        response.setCreatedAt(report.getCreatedAt());
        return response;
    }
}
