package MedVision.Backend.exception;

/**
 * Thrown when the FastAPI AI service is unreachable or returns an unexpected error.
 */
public class FastApiUnavailableException extends RuntimeException {

    public FastApiUnavailableException(String message) {
        super(message);
    }

    public FastApiUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
