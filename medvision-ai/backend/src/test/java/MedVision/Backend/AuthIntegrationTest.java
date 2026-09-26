package MedVision.Backend;

import MedVision.Backend.dto.request.LoginRequest;
import MedVision.Backend.dto.request.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testSuccessfulRegistration() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Dr. John Doe");
        request.setEmail("john.doe@medvision.com");
        request.setPassword("SecurePassword123!");
        request.setRole("DOCTOR");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.user.email").value("john.doe@medvision.com"))
                .andExpect(jsonPath("$.data.user.fullName").value("Dr. John Doe"))
                .andExpect(jsonPath("$.data.user.role").value("DOCTOR"))
                .andExpect(jsonPath("$.data.user.passwordHash").doesNotExist());
    }

    @Test
    public void testDuplicateEmailRegistration() throws Exception {
        RegisterRequest firstRequest = new RegisterRequest();
        firstRequest.setFullName("Dr. Alice Smith");
        firstRequest.setEmail("alice.smith@medvision.com");
        firstRequest.setPassword("Password123!");
        firstRequest.setRole("DOCTOR");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstRequest)))
                .andExpect(status().isCreated());

        // Duplicate registration attempt
        RegisterRequest duplicateRequest = new RegisterRequest();
        duplicateRequest.setFullName("Dr. Alice Duplicate");
        duplicateRequest.setEmail("alice.smith@medvision.com");
        duplicateRequest.setPassword("AnotherPassword123!");
        duplicateRequest.setRole("DOCTOR");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Email is already registered")));
    }

    @Test
    public void testInvalidCredentialsLogin() throws Exception {
        LoginRequest invalidLogin = new LoginRequest();
        invalidLogin.setEmail("nonexistent@medvision.com");
        invalidLogin.setPassword("WrongPassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidLogin)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Invalid email or password")));
    }

    @Test
    public void testSuccessfulLogin() throws Exception {
        // Register user first
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setFullName("Dr. Robert Brown");
        registerRequest.setEmail("robert.brown@medvision.com");
        registerRequest.setPassword("DoctorPassword123!");
        registerRequest.setRole("DOCTOR");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        // Login with correct credentials
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("robert.brown@medvision.com");
        loginRequest.setPassword("DoctorPassword123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value("robert.brown@medvision.com"))
                .andExpect(jsonPath("$.data.user.passwordHash").doesNotExist());
    }

    @Test
    public void testExpiredOrInvalidJwt() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer invalid.jwt.token.here"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("UNAUTHORIZED"));
    }

    @Test
    public void testUnauthorizedRequest() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("UNAUTHORIZED"));
    }

    @Test
    public void testDoctorOnlyEndpoint() throws Exception {
        // 1. Register DOCTOR and get token
        RegisterRequest doctorReq = new RegisterRequest();
        doctorReq.setFullName("Dr. Gregory House");
        doctorReq.setEmail("gregory.house@medvision.com");
        doctorReq.setPassword("Diagnostician123!");
        doctorReq.setRole("DOCTOR");

        MvcResult docResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(doctorReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String docToken = objectMapper.readTree(docResult.getResponse().getContentAsString())
                .path("data").path("token").asText();

        // 2. Register ADMIN and get token
        RegisterRequest adminReq = new RegisterRequest();
        adminReq.setFullName("Admin Lisa Cuddy");
        adminReq.setEmail("lisa.cuddy@medvision.com");
        adminReq.setPassword("AdminPass123!");
        adminReq.setRole("ADMIN");

        MvcResult adminResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String adminToken = objectMapper.readTree(adminResult.getResponse().getContentAsString())
                .path("data").path("token").asText();

        // DOCTOR token can access Doctor endpoint -> 200 OK
        mockMvc.perform(get("/api/doctor/workspace")
                        .header("Authorization", "Bearer " + docToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // ADMIN token cannot access Doctor endpoint -> 403 FORBIDDEN
        mockMvc.perform(get("/api/doctor/workspace")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));
    }

    @Test
    public void testAdminOnlyEndpoint() throws Exception {
        // 1. Register ADMIN and get token
        RegisterRequest adminReq = new RegisterRequest();
        adminReq.setFullName("System Admin");
        adminReq.setEmail("sys.admin@medvision.com");
        adminReq.setPassword("SuperAdmin123!");
        adminReq.setRole("ADMIN");

        MvcResult adminResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String adminToken = objectMapper.readTree(adminResult.getResponse().getContentAsString())
                .path("data").path("token").asText();

        // 2. Register DOCTOR and get token
        RegisterRequest doctorReq = new RegisterRequest();
        doctorReq.setFullName("Dr. James Wilson");
        doctorReq.setEmail("james.wilson@medvision.com");
        doctorReq.setPassword("DoctorPass123!");
        doctorReq.setRole("DOCTOR");

        MvcResult docResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(doctorReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String docToken = objectMapper.readTree(docResult.getResponse().getContentAsString())
                .path("data").path("token").asText();

        // ADMIN token can access Admin endpoint -> 200 OK
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // DOCTOR token cannot access Admin endpoint -> 403 FORBIDDEN
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + docToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));
    }
}
