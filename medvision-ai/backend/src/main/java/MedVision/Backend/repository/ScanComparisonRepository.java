package MedVision.Backend.repository;

import MedVision.Backend.entity.ScanComparison;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScanComparisonRepository extends JpaRepository<ScanComparison, Long> {
    List<ScanComparison> findByPatientId(Long patientId);
}
