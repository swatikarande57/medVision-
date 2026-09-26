package MedVision.Backend.service;

import MedVision.Backend.dto.PatientDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface PatientService {
    PatientDto createPatient(PatientDto patientDto);
    PatientDto getPatientById(Long id);
    PatientDto getPatientByCode(String patientCode);
    List<PatientDto> getAllPatients();
    Page<PatientDto> getAllPatients(Pageable pageable);
    PatientDto updatePatient(Long id, PatientDto patientDto);
    void deletePatient(Long id);
}
