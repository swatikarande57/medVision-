package MedVision.Backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    private long totalPatients;
    private long totalScans;
    private long processingAnalyses;
    private long completedAnalyses;
    private long reviewRequired;
}
