package MedVision.Backend.service.impl;

import MedVision.Backend.dto.PatientDto;
import MedVision.Backend.entity.Patient;
import MedVision.Backend.exception.ResourceNotFoundException;
import MedVision.Backend.repository.PatientRepository;
import MedVision.Backend.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;

    @Override
    @Transactional
    public PatientDto createPatient(PatientDto patientDto) {
        Patient patient = mapToEntity(patientDto);
        Patient savedPatient = patientRepository.save(patient);
        return mapToDto(savedPatient);
    }

    @Override
    public PatientDto getPatientById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));
        return mapToDto(patient);
    }

    @Override
    public PatientDto getPatientByCode(String patientCode) {
        Patient patient = patientRepository.findByPatientCode(patientCode)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with code: " + patientCode));
        return mapToDto(patient);
    }

    @Override
    public List<PatientDto> getAllPatients() {
        return patientRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<PatientDto> getAllPatients(Pageable pageable) {
        return patientRepository.findAll(pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional
    public PatientDto updatePatient(Long id, PatientDto patientDto) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        patient.setFullName(patientDto.getFullName());
        patient.setDateOfBirth(patientDto.getDateOfBirth());
        patient.setGender(patientDto.getGender());
        patient.setPhone(patientDto.getPhone());
        
        // patientCode should ideally not be updated, but handled if necessary

        Patient updatedPatient = patientRepository.save(patient);
        return mapToDto(updatedPatient);
    }

    @Override
    @Transactional
    public void deletePatient(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));
        patientRepository.delete(patient);
    }

    private Patient mapToEntity(PatientDto dto) {
        Patient patient = new Patient();
        patient.setId(dto.getId());
        patient.setPatientCode(dto.getPatientCode());
        patient.setFullName(dto.getFullName());
        patient.setDateOfBirth(dto.getDateOfBirth());
        patient.setGender(dto.getGender());
        patient.setPhone(dto.getPhone());
        return patient;
    }

    private PatientDto mapToDto(Patient patient) {
        PatientDto dto = new PatientDto();
        dto.setId(patient.getId());
        dto.setPatientCode(patient.getPatientCode());
        dto.setFullName(patient.getFullName());
        dto.setDateOfBirth(patient.getDateOfBirth());
        dto.setGender(patient.getGender());
        dto.setPhone(patient.getPhone());
        return dto;
    }
}
