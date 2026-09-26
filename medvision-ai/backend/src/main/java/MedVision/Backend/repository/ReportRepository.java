package MedVision.Backend.repository;

import MedVision.Backend.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByPatientId(Long patientId);
    List<Report> findByScanId(Long scanId);
    Optional<Report> findByAnalysisId(Long analysisId);
}
