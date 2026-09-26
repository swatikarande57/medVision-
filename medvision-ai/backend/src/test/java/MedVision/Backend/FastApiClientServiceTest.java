package MedVision.Backend;

import MedVision.Backend.config.AiServiceProperties;
import MedVision.Backend.dto.fastapi.FastApiJobStatusResponse;
import MedVision.Backend.dto.fastapi.FastApiJobSubmissionResponse;
import MedVision.Backend.exception.FastApiUnavailableException;
import MedVision.Backend.service.FastApiClientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.client.RestClientTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

@RestClientTest({FastApiClientService.class, AiServiceProperties.class})
class FastApiClientServiceTest {

    @Autowired
    private FastApiClientService clientService;

    @Autowired
    private MockRestServiceServer server;

    private Path tempScanFile;

    @BeforeEach
    void setUp() throws IOException {
        tempScanFile = Files.createTempFile("test_scan_", ".jpg");
        Files.write(tempScanFile, new byte[]{1, 2, 3, 4, 5});
    }

    @Test
    @DisplayName("A. submitJob succeeds and parses external jobId correctly")
    void testSubmitJob_Success() {
        String jsonResponse = """
                {
                  "jobId": "job_mock_123456",
                  "status": "QUEUED"
                }
                """;

        server.expect(requestTo("http://localhost:8000/api/ai/jobs"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().contentTypeCompatibleWith(MediaType.MULTIPART_FORM_DATA))
                .andRespond(withSuccess(jsonResponse, MediaType.APPLICATION_JSON));

        FastApiJobSubmissionResponse response = clientService.submitJob(tempScanFile, "test_scan.jpg");

        assertNotNull(response);
        assertEquals("job_mock_123456", response.getJobId());
        assertEquals("QUEUED", response.getStatus());
        server.verify();
    }

    @Test
    @DisplayName("B. submitJob throws FastApiUnavailableException when FastAPI returns HTTP 500")
    void testSubmitJob_ServerError() {
        server.expect(requestTo("http://localhost:8000/api/ai/jobs"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withServerError());

        FastApiUnavailableException ex = assertThrows(
                FastApiUnavailableException.class,
                () -> clientService.submitJob(tempScanFile, "test_scan.jpg")
        );

        assertTrue(ex.getMessage().contains("500"));
        server.verify();
    }

    @Test
    @DisplayName("C. getJobStatus succeeds and parses processing stage and result")
    void testGetJobStatus_Completed() {
        String jsonResponse = """
                {
                  "jobId": "job_mock_123456",
                  "status": "COMPLETED",
                  "progress": 100,
                  "stage": "Processing complete",
                  "error": null,
                  "result": {
                    "jobId": "job_mock_123456",
                    "status": "COMPLETED",
                    "mode": "DEMO",
                    "prediction": { "label": "DEMO_MODE", "confidence": null },
                    "segmentation": { "maskPath": "/path/mask.png", "overlayPath": "/path/overlay.png" },
                    "measurements": { "affectedAreaPercentage": 12.5, "estimatedArea": 45.0 },
                    "processing": { "device": "CPU", "preprocessingTimeMs": 10.0, "inferenceTimeMs": 50.0, "postprocessingTimeMs": 5.0 }
                  }
                }
                """;

        server.expect(requestTo("http://localhost:8000/api/ai/jobs/job_mock_123456"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(jsonResponse, MediaType.APPLICATION_JSON));

        FastApiJobStatusResponse response = clientService.getJobStatus("job_mock_123456");

        assertNotNull(response);
        assertEquals("job_mock_123456", response.getJobId());
        assertEquals("COMPLETED", response.getStatus());
        assertEquals(100, response.getProgress());
        assertNotNull(response.getResult());
        assertEquals("DEMO", response.getResult().getMode());
        assertEquals(12.5, response.getResult().getMeasurements().getAffectedAreaPercentage());
        server.verify();
    }

    @Test
    @DisplayName("D. getJobStatus returns null when FastAPI returns 404 Not Found")
    void testGetJobStatus_NotFound() {
        server.expect(requestTo("http://localhost:8000/api/ai/jobs/job_unknown"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.NOT_FOUND));

        FastApiJobStatusResponse response = clientService.getJobStatus("job_unknown");

        assertNull(response);
        server.verify();
    }
}
