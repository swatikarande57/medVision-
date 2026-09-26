package MedVision.Backend.service.impl;

import MedVision.Backend.dto.ScanDto;
import MedVision.Backend.entity.Patient;
import MedVision.Backend.entity.Scan;
import MedVision.Backend.exception.ResourceNotFoundException;
import MedVision.Backend.repository.PatientRepository;
import MedVision.Backend.repository.ScanRepository;
import MedVision.Backend.service.FileStorageService;
import MedVision.Backend.service.ScanService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScanServiceImpl implements ScanService {

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "dcm", "dicom", "nii", "gz");
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList("image/jpeg", "image/png", "application/dicom", "application/octet-stream", "application/gzip", "application/x-gzip");
    private static final long MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB for NIfTI volumetric MRI

    private final ScanRepository scanRepository;
    private final PatientRepository patientRepository;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional
    public ScanDto uploadScan(Long patientId, MultipartFile file, String modality) throws IOException {
        validateFile(file);

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "scan.png");
        String extension = getExtension(originalFilename);
        
        String storedFilePath = fileStorageService.storeFile(file, patientId);

        Scan scan = new Scan();
        scan.setPatient(patient);
        scan.setOriginalFileName(originalFilename);
        scan.setFilePath(storedFilePath);
        scan.setFileType(extension.toUpperCase());
        scan.setModality(modality != null && !modality.isBlank() ? modality.toUpperCase() : "MRI");
        scan.setStatus("UPLOADED");

        Scan savedScan = scanRepository.save(scan);
        return mapToDto(savedScan);
    }

    @Override
    public ScanDto getScanById(Long id) {
        Scan scan = scanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Scan not found with id: " + id));
        return mapToDto(scan);
    }

    @Override
    public List<ScanDto> getAllScans() {
        return scanRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<ScanDto> getScansByPatientId(Long patientId) {
        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient not found with id: " + patientId);
        }
        return scanRepository.findByPatientId(patientId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Resource loadScanFile(Long id) {
        Scan scan = scanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Scan not found with id: " + id));

        try {
            Path path = Paths.get(scan.getFilePath()).toAbsolutePath().normalize();
            Resource resource = new UrlResource(path.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Scan file not found on disk for scan id: " + id);
            }
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Scan file path invalid for scan id: " + id);
        }
    }

    @Override
    @Transactional
    public void deleteScan(Long id) {
        Scan scan = scanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Scan not found with id: " + id));
        try {
            fileStorageService.deleteFile(scan.getFilePath());
        } catch (IOException ignored) {
        }
        scanRepository.delete(scan);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file cannot be empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum allowed limit of 50MB");
        }
        String filename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        String ext = getExtension(filename);
        // For compound extension .nii.gz, both "nii" and "gz" are valid
        if (!ALLOWED_EXTENSIONS.contains(ext.toLowerCase()) && !"nii.gz".equals(ext.toLowerCase())) {
            throw new IllegalArgumentException("Invalid file extension: ." + ext + ". Allowed: " + ALLOWED_EXTENSIONS);
        }
        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank() && !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid MIME type: " + contentType);
        }
    }

    private String getExtension(String filename) {
        // Handle compound extension .nii.gz
        String lower = filename.toLowerCase();
        if (lower.endsWith(".nii.gz")) {
            return "nii.gz";
        }
        int idx = filename.lastIndexOf('.');
        return (idx > 0 && idx < filename.length() - 1) ? filename.substring(idx + 1) : "";
    }

    private ScanDto mapToDto(Scan scan) {
        ScanDto dto = new ScanDto();
        dto.setId(scan.getId());
        dto.setPatientId(scan.getPatient().getId());
        dto.setOriginalFileName(scan.getOriginalFileName());
        dto.setFileType(scan.getFileType());
        dto.setModality(scan.getModality());
        dto.setStatus(scan.getStatus());
        dto.setUploadedAt(scan.getUploadedAt());
        return dto;
    }
}
