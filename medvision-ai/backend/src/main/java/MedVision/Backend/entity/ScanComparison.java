package MedVision.Backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "scan_comparisons")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class ScanComparison {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "previous_scan_id", nullable = false)
    private Scan previousScan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_scan_id", nullable = false)
    private Scan currentScan;

    @Column(name = "previous_affected_area")
    private Double previousAffectedArea;

    @Column(name = "current_affected_area")
    private Double currentAffectedArea;

    @Column(name = "percentage_change")
    private Double percentageChange;

    @Column(columnDefinition = "TEXT")
    private String interpretation;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
