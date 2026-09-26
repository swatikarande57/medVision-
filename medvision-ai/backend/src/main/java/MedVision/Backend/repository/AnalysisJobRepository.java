package MedVision.Backend.repository;

import MedVision.Backend.entity.AnalysisJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnalysisJobRepository extends JpaRepository<AnalysisJob, Long> {
    List<AnalysisJob> findByScanId(Long scanId);
    Optional<AnalysisJob> findByExternalJobId(String externalJobId);

    /**
     * Used by AnalysisJobPoller to find all in-flight jobs that have been
     * forwarded to FastAPI (externalJobId is populated).
     */
    List<AnalysisJob> findByStatusInAndExternalJobIdIsNotNull(Collection<String> statuses);
}

