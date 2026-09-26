package MedVision.Backend;

import MedVision.Backend.dto.request.ComparisonRequest;
import MedVision.Backend.dto.request.JobRequest;
import MedVision.Backend.dto.request.PatientRequest;
import MedVision.Backend.dto.request.ReportRequest;
import MedVision.Backend.entity.AIAnalysis;
import MedVision.Backend.entity.Patient;
import MedVision.Backend.entity.Scan;
import MedVision.Backend.repository.AIAnalysisRepository;
import MedVision.Backend.repository.PatientRepository;
import MedVision.Backend.repository.ScanRepository;
import MedVision.Backend.service.FastApiClientService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.security.test.context.support.WithMockUser;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@WithMockUser(roles = "DOCTOR")
public class ApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private ScanRepository scanRepository;

    @Autowired
    private AIAnalysisRepository aiAnalysisRepository;

    @org.springframework.boot.test.mock.mockito.MockBean
    private FastApiClientService fastApiClientService;

    @Test
    public void testPatientCreateReadUpdateDeleteAndPagination() throws Exception {
        // 1. Create Patient
        PatientRequest request = new PatientRequest();
        request.setPatientCode("PT-MVC-001");
        request.setFullName("Mock Patient");
        request.setDateOfBirth(LocalDate.of(1985, 4, 12));
        request.setGender("MALE");
        request.setPhone("+1234567890");

        String jsonResponse = mockMvc.perform(post("/api/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.patientCode").value("PT-MVC-001"))
                .andReturn().getResponse().getContentAsString();

        Long patientId = objectMapper.readTree(jsonResponse).get("data").get("id").asLong();

        // 2. Read Patient
        mockMvc.perform(get("/api/patients/" + patientId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Mock Patient"));

        // 3. Search & Pagination
        mockMvc.perform(get("/api/patients?page=0&size=5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray());

        // 4. Update Patient
        request.setFullName("Mock Patient Updated");
        mockMvc.perform(put("/api/patients/" + patientId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Mock Patient Updated"));

        // 5. Delete Patient
        mockMvc.perform(delete("/api/patients/" + patientId))
                .andExpect(status().isNoContent());

        // 6. Missing Patient 404
        mockMvc.perform(get("/api/patients/" + patientId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    public void testPatientValidationFailure() throws Exception {
        PatientRequest invalidRequest = new PatientRequest();
        invalidRequest.setPatientCode(""); // Blank code
        invalidRequest.setFullName(""); // Blank name

        mockMvc.perform(post("/api/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));
    }

    @Test
    public void testScanUploadAndRetrieval() throws Exception {
        // Create Patient first
        Patient patient = new Patient();
        patient.setPatientCode("PT-SCAN-01");
        patient.setFullName("Scan Test Patient");
        patient = patientRepository.save(patient);

        // Upload Valid Scan
        MockMultipartFile validFile = new MockMultipartFile(
                "file",
                "brain_mri.png",
                MediaType.IMAGE_PNG_VALUE,
                "dummy image content".getBytes()
        );

        String uploadResponse = mockMvc.perform(multipart("/api/scans/upload")
                        .file(validFile)
                        .param("patientId", patient.getId().toString())
                        .param("modality", "MRI"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.originalFileName").value("brain_mri.png"))
                .andExpect(jsonPath("$.data.modality").value("MRI"))
                .andReturn().getResponse().getContentAsString();

        Long scanId = objectMapper.readTree(uploadResponse).get("data").get("id").asLong();

        // Get Scan by Id
        mockMvc.perform(get("/api/scans/" + scanId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("UPLOADED"));

        // Get Scans by Patient
        mockMvc.perform(get("/api/scans/patient/" + patient.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(scanId));

        // Invalid File Extension Upload
        MockMultipartFile invalidFile = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/x-msdownload",
                "fake content".getBytes()
        );

        mockMvc.perform(multipart("/api/scans/upload")
                        .file(invalidFile)
                        .param("patientId", patient.getId().toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    public void testAnalysisJobAndRetrieval() throws Exception {
        Patient patient = new Patient();
        patient.setPatientCode("PT-JOB-01");
        patient.setFullName("Job Patient");
        patient = patientRepository.save(patient);

        java.nio.file.Path tempFile = java.nio.file.Files.createTempFile("test_scan_", ".dcm");
        java.nio.file.Files.write(tempFile, new byte[]{1, 2, 3});

        Scan scan = new Scan();
        scan.setPatient(patient);
        scan.setOriginalFileName("scan.dcm");
        scan.setFilePath(tempFile.toAbsolutePath().toString());
        scan.setStatus("UPLOADED");
        scan = scanRepository.save(scan);

        MedVision.Backend.dto.fastapi.FastApiJobSubmissionResponse mockFastApiResp = new MedVision.Backend.dto.fastapi.FastApiJobSubmissionResponse();
        mockFastApiResp.setJobId("job_mock_mvc_123");
        mockFastApiResp.setStatus("QUEUED");
        org.mockito.Mockito.when(fastApiClientService.submitJob(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(mockFastApiResp);

        // Create Analysis Job
        JobRequest jobRequest = new JobRequest();
        jobRequest.setScanId(scan.getId());

        String jobResponse = mockMvc.perform(post("/api/analysis/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(jobRequest)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("QUEUED"))
                .andReturn().getResponse().getContentAsString();

        Long jobId = objectMapper.readTree(jobResponse).get("data").get("jobId").asLong();

        // Retrieve Job status
        mockMvc.perform(get("/api/analysis/jobs/" + jobId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("QUEUED"));
    }

    @Test
    public void testReportAndComparisonApis() throws Exception {
        Patient patient = new Patient();
        patient.setPatientCode("PT-REP-01");
        patient.setFullName("Report Patient");
        patient = patientRepository.save(patient);

        Scan prevScan = new Scan();
        prevScan.setPatient(patient);
        prevScan.setOriginalFileName("scan1.dcm");
        prevScan.setFilePath("/tmp/scan1.dcm");
        prevScan.setStatus("COMPLETED");
        prevScan = scanRepository.save(prevScan);

        AIAnalysis prevAnalysis = new AIAnalysis();
        prevAnalysis.setScan(prevScan);
        prevAnalysis.setTumorDetected(true);
        prevAnalysis.setAffectedAreaPercentage(10.0);
        prevAnalysis = aiAnalysisRepository.save(prevAnalysis);

        Scan currScan = new Scan();
        currScan.setPatient(patient);
        currScan.setOriginalFileName("scan2.dcm");
        currScan.setFilePath("/tmp/scan2.dcm");
        currScan.setStatus("COMPLETED");
        currScan = scanRepository.save(currScan);

        AIAnalysis currAnalysis = new AIAnalysis();
        currAnalysis.setScan(currScan);
        currAnalysis.setTumorDetected(true);
        currAnalysis.setAffectedAreaPercentage(15.0);
        currAnalysis = aiAnalysisRepository.save(currAnalysis);

        // Generate Report
        ReportRequest reportRequest = new ReportRequest();
        reportRequest.setPatientId(patient.getId());
        reportRequest.setScanId(currScan.getId());
        reportRequest.setAnalysisId(currAnalysis.getId());

        mockMvc.perform(post("/api/reports/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reportRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.reportPath").value(containsString(".pdf")));

        // Generate Comparison
        ComparisonRequest compRequest = new ComparisonRequest();
        compRequest.setPreviousScanId(prevScan.getId());
        compRequest.setCurrentScanId(currScan.getId());

        mockMvc.perform(post("/api/comparisons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(compRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.percentageChange").value(50.0))
                .andExpect(jsonPath("$.data.interpretation").value(containsString("AI-assisted longitudinal trend analysis")));
    }
}
