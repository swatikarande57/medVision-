package MedVision.Backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "analysis_jobs")
@Getter
@Setter
public class AnalysisJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scan_id", nullable = false)
    private Scan scan;

    @Column(name = "external_job_id", length = 100)
    private String externalJobId;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(columnDefinition = "DOUBLE DEFAULT 0.0")
    private Double progress;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    /** Tracks the number of consecutive polling failures against maxRetries threshold. */
    @Column(name = "retry_count", columnDefinition = "INT DEFAULT 0")
    private int retryCount = 0;
}
