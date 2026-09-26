package MedVision.Backend;

import MedVision.Backend.dto.PatientDto;
import MedVision.Backend.dto.ScanDto;
import MedVision.Backend.entity.AIAnalysis;
import MedVision.Backend.entity.Patient;
import MedVision.Backend.entity.Scan;
import MedVision.Backend.repository.AIAnalysisRepository;
import MedVision.Backend.repository.PatientRepository;
import MedVision.Backend.repository.ScanRepository;
import MedVision.Backend.service.PatientService;
import MedVision.Backend.service.ScanService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional  // Rolls back after each test
public class DatabaseIntegrationTest {

    @Autowired
    private PatientService patientService;

    @Autowired
    private ScanService scanService;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private ScanRepository scanRepository;

    @Autowired
    private AIAnalysisRepository aiAnalysisRepository;

    @Test
    public void testPatientCrudOperations() {
        // Create
        PatientDto dto = new PatientDto();
        dto.setPatientCode("PT-TEST-001");
        dto.setFullName("Test Patient");
        dto.setDateOfBirth(LocalDate.of(1990, 1, 1));
        dto.setGender("MALE");
        dto.setPhone("1234567890");

        PatientDto savedPatient = patientService.createPatient(dto);
        assertThat(savedPatient.getId()).isNotNull();
        assertThat(savedPatient.getPatientCode()).isEqualTo("PT-TEST-001");

        // Read
        PatientDto retrievedPatient = patientService.getPatientById(savedPatient.getId());
        assertThat(retrievedPatient.getFullName()).isEqualTo("Test Patient");

        // Update
        retrievedPatient.setFullName("Test Patient Updated");
        PatientDto updatedPatient = patientService.updatePatient(retrievedPatient.getId(), retrievedPatient);
        assertThat(updatedPatient.getFullName()).isEqualTo("Test Patient Updated");

        // Delete
        patientService.deletePatient(updatedPatient.getId());
        
        Optional<Patient> deletedPatient = patientRepository.findById(updatedPatient.getId());
        assertThat(deletedPatient.isPresent()).isFalse();
    }

    @Test
    public void testScanAndAnalysisRelationship() {
        // Create Patient
        Patient patient = new Patient();
        patient.setPatientCode("PT-TEST-002");
        patient.setFullName("Test Patient 2");
        patient = patientRepository.save(patient);

        // Create Scan
        Scan scan = new Scan();
        scan.setPatient(patient);
        scan.setOriginalFileName("test_scan.dcm");
        scan.setFilePath("/scans/test_scan.dcm");
        scan.setModality("MRI");
        scan.setStatus("UPLOADED");
        scan = scanRepository.save(scan);

        assertThat(scan.getId()).isNotNull();

        // Create AIAnalysis linked to Scan
        AIAnalysis analysis = new AIAnalysis();
        analysis.setScan(scan);
        analysis.setTumorDetected(true);
        analysis.setConfidence(98.5);
        analysis = aiAnalysisRepository.save(analysis);

        assertThat(analysis.getId()).isNotNull();

        // Retrieve Analysis and check relationship
        Optional<AIAnalysis> retrievedAnalysis = aiAnalysisRepository.findById(analysis.getId());
        assertThat(retrievedAnalysis.isPresent()).isTrue();
        assertThat(retrievedAnalysis.get().getScan().getId()).isEqualTo(scan.getId());
        assertThat(retrievedAnalysis.get().getScan().getPatient().getId()).isEqualTo(patient.getId());
    }
}
