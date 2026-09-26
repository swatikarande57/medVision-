package MedVision.Backend.controller;

import MedVision.Backend.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TestRoleController {

    @GetMapping("/doctor/workspace")
    public ResponseEntity<ApiResponse<String>> getDoctorWorkspace() {
        return ResponseEntity.ok(ApiResponse.success("Welcome to Doctor Workspace", "Doctor Access Granted"));
    }

    @GetMapping("/admin/dashboard")
    public ResponseEntity<ApiResponse<String>> getAdminDashboard() {
        return ResponseEntity.ok(ApiResponse.success("Welcome to Admin Dashboard", "Admin Access Granted"));
    }
}
