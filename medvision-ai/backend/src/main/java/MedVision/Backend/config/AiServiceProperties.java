package MedVision.Backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "ai-service")
@Getter
@Setter
public class AiServiceProperties {

    /** Base URL of the Python FastAPI AI service. */
    private String baseUrl = "http://localhost:8000";

    /** HTTP connection timeout in milliseconds. */
    private int connectTimeoutMs = 5000;

    /** HTTP read/response timeout in milliseconds (300s for CPU inference). */
    private int readTimeoutMs = 300000;

    /** Maximum number of polling retries before marking a job as FAILED. */
    private int maxRetries = 5;

    /** Delay between scheduled polling cycles in milliseconds. */
    private long pollingIntervalMs = 3000;
}
