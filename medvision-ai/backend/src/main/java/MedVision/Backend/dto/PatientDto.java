package MedVision.Backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class PatientDto {
    private Long id;
    private String patientCode;
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private String phone;
}
