package MedVision.Backend;

import MedVision.Backend.dto.fastapi.*;
import MedVision.Backend.dto.response.JobResponse;
import MedVision.Backend.entity.AIAnalysis;
import MedVision.Backend.entity.AnalysisJob;
import MedVision.Backend.entity.Patient;
import MedVision.Backend.entity.Scan;
import MedVision.Backend.exception.FastApiUnavailableException;
import MedVision.Backend.repository.AIAnalysisRepository;
import MedVision.Backend.repository.AnalysisJobRepository;
import MedVision.Backend.repository.PatientRepository;
import MedVision.Backend.repository.ScanRepository;
import MedVision.Backend.service.AnalysisJobPoller;
import MedVision.Backend.service.AnalysisService;
import MedVision.Backend.service.FastApiClientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class AnalysisJobIntegrationTest {

    @Autowired
    private AnalysisService analysisService;

    @Autowired
    private AnalysisJobRepository analysisJobRepository;

    @Autowired
    private AIAnalysisRepository aiAnalysisRepository;

    @Autowired
    private ScanRepository scanRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AnalysisJobPoller poller;

    @MockBean
    private FastApiClientService fastApiClientService;

    private Scan testScan;

    @BeforeEach
    void setUp() throws IOException {
        Patient patient = new Patient();
        patient.setPatientCode("PT-TEST-001");
        patient.setFullName("Test Patient");
        patient.setDateOfBirth(LocalDate.of(1985, 5, 20));
        patient.setGender("FEMALE");
        patient = patientRepository.save(patient);

        Path tempFile = Files.createTempFile("scan_test_", ".jpg");
        Files.write(tempFile, new byte[]{1, 2, 3});

        testScan = new Scan();
        testScan.setPatient(patient);
        testScan.setOriginalFileName("scan_test.jpg");
        testScan.setFilePath(tempFile.toAbsolutePath().toString());
        testScan.setFileType("image/jpeg");
        testScan.setModality("CT");
        testScan.setStatus("COMPLETED");
        testScan.setUploadedAt(LocalDateTime.now());
        testScan = scanRepository.save(testScan);
    }

    @Test
    @DisplayName("C & D. createAnalysisJob creates QUEUED job and persists externalJobId from FastAPI")
    void testCreateAnalysisJob_Success() {
        FastApiJobSubmissionResponse fastApiResponse = new FastApiJobSubmissionResponse();
        fastApiResponse.setJobId("job_fastapi_999");
        fastApiResponse.setStatus("QUEUED");

        when(fastApiClientService.submitJob(any(Path.class), eq("scan_test.jpg")))
                .thenReturn(fastApiResponse);

        JobResponse response = analysisService.createAnalysisJob(testScan.getId());

        assertNotNull(response);
        assertNotNull(response.getJobId());
        assertEquals("QUEUED", response.getStatus());
        assertEquals("job_fastapi_999", response.getExternalJobId());

        Optional<AnalysisJob> dbJob = analysisJobRepository.findById(response.getJobId());
        assertTrue(dbJob.isPresent());
        assertEquals("job_fastapi_999", dbJob.get().getExternalJobId());
    }

    @Test
    @DisplayName("E & F. AnalysisJobPoller updates status to COMPLETED and persists AIAnalysis with DEMO mode summary")
    void testPoller_CompletedFlow() {
        // Step 1: Create job
        FastApiJobSubmissionResponse fastApiResponse = new FastApiJobSubmissionResponse();
        fastApiResponse.setJobId("job_fastapi_888");
        fastApiResponse.setStatus("QUEUED");
        when(fastApiClientService.submitJob(any(), any())).thenReturn(fastApiResponse);

        JobResponse jobResp = analysisService.createAnalysisJob(testScan.getId());

        // Step 2: Mock FastAPI returning COMPLETED with DEMO mode
        FastApiJobStatusResponse statusResp = new FastApiJobStatusResponse();
        statusResp.setJobId("job_fastapi_888");
        statusResp.setStatus("COMPLETED");
        statusResp.setProgress(100);
        statusResp.setStage("Processing complete");

        FastApiInferenceResult result = new FastApiInferenceResult();
        result.setJobId("job_fastapi_888");
        result.setStatus("COMPLETED");
        result.setMode("DEMO");

        FastApiPredictionData pred = new FastApiPredictionData();
        pred.setLabel("DEMO_MODE");
        pred.setConfidence(null); // Explicit null confidence in DEMO mode
        result.setPrediction(pred);

        FastApiMeasurementsData meas = new FastApiMeasurementsData();
        meas.setAffectedAreaPercentage(15.2);
        meas.setEstimatedArea(42.0);
        result.setMeasurements(meas);

        statusResp.setResult(result);

        when(fastApiClientService.getJobStatus("job_fastapi_888")).thenReturn(statusResp);

        // Step 3: Run poller
        poller.pollInFlightJobs();

        // Step 4: Verify AnalysisJob status = COMPLETED
        AnalysisJob dbJob = analysisJobRepository.findById(jobResp.getJobId()).orElseThrow();
        assertEquals("COMPLETED", dbJob.getStatus());
        assertEquals(100.0, dbJob.getProgress());

        // Step 5: Verify AIAnalysis record created in database with DEMO mode summary
        Optional<AIAnalysis> dbAnalysis = aiAnalysisRepository.findByScanId(testScan.getId());
        assertTrue(dbAnalysis.isPresent());
        assertEquals(15.2, dbAnalysis.get().getAffectedAreaPercentage());
        assertTrue(dbAnalysis.get().getResultSummary().contains("[DEMO]"));
    }

    @Test
    @DisplayName("G. AnalysisJob marked FAILED when FastAPI returns error status")
    void testPoller_FailedFlow() {
        FastApiJobSubmissionResponse fastApiResponse = new FastApiJobSubmissionResponse();
        fastApiResponse.setJobId("job_fastapi_777");
        fastApiResponse.setStatus("QUEUED");
        when(fastApiClientService.submitJob(any(), any())).thenReturn(fastApiResponse);

        JobResponse jobResp = analysisService.createAnalysisJob(testScan.getId());

        FastApiJobStatusResponse statusResp = new FastApiJobStatusResponse();
        statusResp.setJobId("job_fastapi_777");
        statusResp.setStatus("FAILED");
        statusResp.setError("Memory allocation error during MONAI pipeline");
        when(fastApiClientService.getJobStatus("job_fastapi_777")).thenReturn(statusResp);

        poller.pollInFlightJobs();

        AnalysisJob dbJob = analysisJobRepository.findById(jobResp.getJobId()).orElseThrow();
        assertEquals("FAILED", dbJob.getStatus());
        assertTrue(dbJob.getErrorMessage().contains("Memory allocation error"));

        // Confirm NO AIAnalysis record was persisted for failed job
        Optional<AIAnalysis> dbAnalysis = aiAnalysisRepository.findByScanId(testScan.getId());
        assertTrue(dbAnalysis.isEmpty());
    }

    @Test
    @DisplayName("H. Handle FastAPI unavailable on initial submit — job marked FAILED immediately")
    void testCreateAnalysisJob_FastApiDown() {
        when(fastApiClientService.submitJob(any(), any()))
                .thenThrow(new FastApiUnavailableException("Connection refused at http://localhost:8000"));

        JobResponse response = analysisService.createAnalysisJob(testScan.getId());

        assertNotNull(response);
        assertEquals("FAILED", response.getStatus());
        assertTrue(response.getErrorMessage().contains("FastAPI AI service unavailable"));
    }
}
