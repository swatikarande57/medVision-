package MedVision.Backend.service.impl;

import MedVision.Backend.dto.request.ComparisonRequest;
import MedVision.Backend.dto.response.ComparisonResponse;
import MedVision.Backend.entity.AIAnalysis;
import MedVision.Backend.entity.Patient;
import MedVision.Backend.entity.Scan;
import MedVision.Backend.entity.ScanComparison;
import MedVision.Backend.exception.ResourceNotFoundException;
import MedVision.Backend.repository.AIAnalysisRepository;
import MedVision.Backend.repository.PatientRepository;
import MedVision.Backend.repository.ScanComparisonRepository;
import MedVision.Backend.repository.ScanRepository;
import MedVision.Backend.service.ComparisonService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComparisonServiceImpl implements ComparisonService {

    private final ScanComparisonRepository scanComparisonRepository;
    private final ScanRepository scanRepository;
    private final PatientRepository patientRepository;
    private final AIAnalysisRepository aiAnalysisRepository;

    @Override
    public List<ComparisonResponse> getComparisonsByPatientId(Long patientId) {
        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient not found with id: " + patientId);
        }
        return scanComparisonRepository.findByPatientId(patientId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ComparisonResponse createComparison(ComparisonRequest request) {
        Scan prevScan = scanRepository.findById(request.getPreviousScanId())
                .orElseThrow(() -> new ResourceNotFoundException("Previous scan not found with id: " + request.getPreviousScanId()));
        Scan currScan = scanRepository.findById(request.getCurrentScanId())
                .orElseThrow(() -> new ResourceNotFoundException("Current scan not found with id: " + request.getCurrentScanId()));

        if (!prevScan.getPatient().getId().equals(currScan.getPatient().getId())) {
            throw new IllegalArgumentException("Both scans must belong to the same patient");
        }

        Patient patient = prevScan.getPatient();

        Optional<AIAnalysis> prevAnalysis = aiAnalysisRepository.findByScanId(prevScan.getId());
        Optional<AIAnalysis> currAnalysis = aiAnalysisRepository.findByScanId(currScan.getId());

        double prevArea = prevAnalysis.map(a -> a.getAffectedAreaPercentage() != null ? a.getAffectedAreaPercentage() : 0.0).orElse(0.0);
        double currArea = currAnalysis.map(a -> a.getAffectedAreaPercentage() != null ? a.getAffectedAreaPercentage() : 0.0).orElse(0.0);

        double percentageChange = 0.0;
        if (prevArea > 0) {
            percentageChange = ((currArea - prevArea) / prevArea) * 100.0;
        }

        String interpretationTrend;
        if (percentageChange > 1.0) {
            interpretationTrend = "Increase in affected area observed (+ " + String.format("%.2f", percentageChange) + "%).";
        } else if (percentageChange < -1.0) {
            interpretationTrend = "Decrease in affected area observed (" + String.format("%.2f", percentageChange) + "%).";
        } else {
            interpretationTrend = "Stable affected area detected.";
        }

        String interpretation = "AI-assisted longitudinal trend analysis: " + interpretationTrend;

        ScanComparison comparison = new ScanComparison();
        comparison.setPatient(patient);
        comparison.setPreviousScan(prevScan);
        comparison.setCurrentScan(currScan);
        comparison.setPreviousAffectedArea(prevArea);
        comparison.setCurrentAffectedArea(currArea);
        comparison.setPercentageChange(percentageChange);
        comparison.setInterpretation(interpretation);

        ScanComparison saved = scanComparisonRepository.save(comparison);
        return mapToResponse(saved);
    }

    private ComparisonResponse mapToResponse(ScanComparison comparison) {
        ComparisonResponse response = new ComparisonResponse();
        response.setId(comparison.getId());
        response.setPatientId(comparison.getPatient().getId());
        response.setPreviousScanId(comparison.getPreviousScan().getId());
        response.setCurrentScanId(comparison.getCurrentScan().getId());
        response.setPreviousAffectedArea(comparison.getPreviousAffectedArea());
        response.setCurrentAffectedArea(comparison.getCurrentAffectedArea());
        
        double absoluteChange = (comparison.getCurrentAffectedArea() != null ? comparison.getCurrentAffectedArea() : 0.0) 
                - (comparison.getPreviousAffectedArea() != null ? comparison.getPreviousAffectedArea() : 0.0);
        response.setAbsoluteChange(Math.round(absoluteChange * 100.0) / 100.0);
        response.setPercentageChange(comparison.getPercentageChange() != null ? Math.round(comparison.getPercentageChange() * 100.0) / 100.0 : 0.0);

        if (comparison.getPreviousScan().getUploadedAt() != null && comparison.getCurrentScan().getUploadedAt() != null) {
            long days = Duration.between(comparison.getPreviousScan().getUploadedAt(), comparison.getCurrentScan().getUploadedAt()).toDays();
            response.setTimeDifference(Math.abs(days) + " days");
        } else {
            response.setTimeDifference("N/A");
        }

        response.setInterpretation(comparison.getInterpretation());
        response.setCreatedAt(comparison.getCreatedAt());
        return response;
    }
}
