package MedVision.Backend.repository;

import MedVision.Backend.entity.AIAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AIAnalysisRepository extends JpaRepository<AIAnalysis, Long> {
    Optional<AIAnalysis> findByScanId(Long scanId);
    List<AIAnalysis> findByScanPatientId(Long patientId);
}
