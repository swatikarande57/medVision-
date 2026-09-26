package MedVision.Backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_analyses")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class AIAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scan_id", nullable = false)
    private Scan scan;

    @Column(name = "tumor_detected", nullable = false)
    private Boolean tumorDetected = false;

    private Double confidence;

    @Column(name = "affected_area_percentage")
    private Double affectedAreaPercentage;

    @Column(name = "estimated_area")
    private Double estimatedArea;

    @Column(name = "result_summary", columnDefinition = "TEXT")
    private String resultSummary;

    @Column(name = "mask_path", length = 500)
    private String maskPath;

    @Column(name = "overlay_path", length = 500)
    private String overlayPath;

    @Column(name = "model_name", length = 200)
    private String modelName;

    @Column(name = "mode", length = 50)
    private String mode;

    @Column(name = "device", length = 50)
    private String device;

    @Column(name = "inference_time_ms")
    private Double inferenceTimeMs;

    @Column(name = "affected_volume_cm3")
    private Double affectedVolumeCm3;

    @Column(name = "regions_json", columnDefinition = "TEXT")
    private String regionsJson;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
