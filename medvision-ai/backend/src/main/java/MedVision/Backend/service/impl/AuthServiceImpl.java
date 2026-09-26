package MedVision.Backend.service.impl;

import MedVision.Backend.dto.request.LoginRequest;
import MedVision.Backend.dto.request.RegisterRequest;
import MedVision.Backend.dto.response.AuthResponse;
import MedVision.Backend.dto.response.UserResponse;
import MedVision.Backend.entity.User;
import MedVision.Backend.exception.ResourceNotFoundException;
import MedVision.Backend.repository.UserRepository;
import MedVision.Backend.security.JwtTokenProvider;
import MedVision.Backend.service.AuthService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager,
                           JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        String role = request.getRole();
        if (role == null || role.isBlank()) {
            role = "DOCTOR";
        } else {
            role = role.trim().toUpperCase();
            if (!role.equalsIgnoreCase("DOCTOR") && !role.equalsIgnoreCase("ADMIN")) {
                throw new IllegalArgumentException("Invalid role. Role must be DOCTOR or ADMIN");
            }
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);

        User savedUser = userRepository.save(user);

        String token = tokenProvider.generateTokenFromEmail(savedUser.getEmail(), savedUser.getRole());
        UserResponse userResponse = mapToUserResponse(savedUser);

        return new AuthResponse(token, userResponse);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

            String token = tokenProvider.generateToken(authentication);
            UserResponse userResponse = mapToUserResponse(user);

            return new AuthResponse(token, userResponse);
        } catch (BadCredentialsException ex) {
            throw new IllegalArgumentException("Invalid email or password");
        }
    }

    @Override
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return mapToUserResponse(user);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
