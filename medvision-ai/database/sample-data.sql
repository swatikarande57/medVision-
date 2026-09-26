-- Sample Data
INSERT INTO users (full_name, email, password_hash, role) VALUES 
('Admin User', 'admin@medvision.com', 'hashed_pwd_123', 'ADMIN'),
('Dr. Smith', 'smith@medvision.com', 'hashed_pwd_456', 'DOCTOR');

INSERT INTO patients (patient_code, full_name, date_of_birth, gender, phone) VALUES 
('PT-1001', 'John Doe', '1980-05-15', 'MALE', '555-0101'),
('PT-1002', 'Jane Roe', '1992-11-20', 'FEMALE', '555-0202');

INSERT INTO scans (patient_id, original_file_name, file_path, file_type, modality, status) VALUES 
(1, 'brain_mri_01.dcm', '/uploads/scans/pt1001/mri1.dcm', 'DICOM', 'MRI', 'COMPLETED'),
(2, 'lung_ct_01.dcm', '/uploads/scans/pt1002/ct1.dcm', 'DICOM', 'CT', 'COMPLETED');

INSERT INTO ai_analyses (scan_id, tumor_detected, confidence, affected_area_percentage, estimated_area, result_summary) VALUES 
(1, TRUE, 95.5, 5.2, 12.4, 'Small mass detected in the left frontal lobe.'),
(2, FALSE, 99.1, 0.0, 0.0, 'No clear signs of abnormalities.');
