package MedVision.Backend.controller;

import MedVision.Backend.dto.PatientDto;
import MedVision.Backend.dto.request.PatientRequest;
import MedVision.Backend.dto.response.ApiResponse;
import MedVision.Backend.dto.response.PatientResponse;
import MedVision.Backend.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PatientResponse> createPatient(@Valid @RequestBody PatientRequest request) {
        PatientDto dto = mapRequestToDto(request);
        PatientDto saved = patientService.createPatient(dto);
        return ApiResponse.success("Patient created successfully", mapDtoToResponse(saved));
    }

    @GetMapping("/{id}")
    public ApiResponse<PatientResponse> getPatientById(@PathVariable Long id) {
        PatientDto dto = patientService.getPatientById(id);
        return ApiResponse.success("Patient retrieved successfully", mapDtoToResponse(dto));
    }

    @GetMapping
    public ApiResponse<Page<PatientResponse>> getAllPatients(Pageable pageable) {
        Page<PatientDto> patients = patientService.getAllPatients(pageable);
        return ApiResponse.success("Patients retrieved successfully", patients.map(this::mapDtoToResponse));
    }

    @PutMapping("/{id}")
    public ApiResponse<PatientResponse> updatePatient(@PathVariable Long id, @Valid @RequestBody PatientRequest request) {
        PatientDto dto = mapRequestToDto(request);
        PatientDto updated = patientService.updatePatient(id, dto);
        return ApiResponse.success("Patient updated successfully", mapDtoToResponse(updated));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePatient(@PathVariable Long id) {
        patientService.deletePatient(id);
    }
    
    @GetMapping("/search")
    public ApiResponse<PatientResponse> searchPatient(@RequestParam String query) {
        PatientDto dto = patientService.getPatientByCode(query);
        return ApiResponse.success("Patient found", mapDtoToResponse(dto));
    }

    // Mapping utility methods
    private PatientDto mapRequestToDto(PatientRequest request) {
        PatientDto dto = new PatientDto();
        dto.setPatientCode(request.getPatientCode());
        dto.setFullName(request.getFullName());
        dto.setDateOfBirth(request.getDateOfBirth());
        dto.setGender(request.getGender());
        dto.setPhone(request.getPhone());
        return dto;
    }

    private PatientResponse mapDtoToResponse(PatientDto dto) {
        PatientResponse response = new PatientResponse();
        response.setId(dto.getId());
        response.setPatientCode(dto.getPatientCode());
        response.setFullName(dto.getFullName());
        response.setDateOfBirth(dto.getDateOfBirth());
        response.setGender(dto.getGender());
        response.setPhone(dto.getPhone());
        return response;
    }
}
