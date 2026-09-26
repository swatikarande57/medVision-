package MedVision.Backend.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public interface FileStorageService {
    String storeFile(MultipartFile file, Long patientId) throws IOException;
    void deleteFile(String filePath) throws IOException;
}
