package MedVision.Backend.service;

import MedVision.Backend.dto.request.LoginRequest;
import MedVision.Backend.dto.request.RegisterRequest;
import MedVision.Backend.dto.response.AuthResponse;
import MedVision.Backend.dto.response.UserResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse getCurrentUser(String email);
}
