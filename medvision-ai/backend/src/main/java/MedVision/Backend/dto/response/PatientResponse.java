package MedVision.Backend.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class PatientResponse {
    private Long id;
    private String patientCode;
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private String phone;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
