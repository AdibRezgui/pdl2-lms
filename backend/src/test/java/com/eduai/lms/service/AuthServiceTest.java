package com.eduai.lms.service;

import com.eduai.lms.dto.request.LoginRequest;
import com.eduai.lms.dto.request.RegisterRequest;
import com.eduai.lms.dto.response.AuthResponse;
import com.eduai.lms.model.User;
import com.eduai.lms.model.enums.UserRole;
import com.eduai.lms.repository.UserRepository;
import com.eduai.lms.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock AuthenticationManager authenticationManager;
    @Mock UserDetailsService userDetailsService;
    @Mock EmailService emailService;

    @InjectMocks AuthService authService;

    private User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .name("Test User")
                .email("test@eduai.tn")
                .password("encoded")
                .role(UserRole.STUDENT)
                .active(true)
                .build();
    }

    @Test
    void register_newEmail_returnsAuthResponse() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Test User");
        req.setEmail("test@eduai.tn");
        req.setPassword("Password1!");
        req.setRole(UserRole.STUDENT);

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");
        when(userRepository.save(any())).thenReturn(mockUser);
        when(jwtService.generateToken(anyMap(), any())).thenReturn("access-token");
        when(jwtService.generateRefreshToken(any())).thenReturn("refresh-token");
        doNothing().when(emailService).sendWelcomeEmail(anyString(), anyString());

        AuthResponse res = authService.register(req);

        assertThat(res.getToken()).isEqualTo("access-token");
        assertThat(res.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(res.getRole()).isEqualTo(UserRole.STUDENT);
        verify(emailService).sendWelcomeEmail("test@eduai.tn", "Test User");
    }

    @Test
    void register_existingEmail_throwsException() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("taken@eduai.tn");
        when(userRepository.existsByEmail("taken@eduai.tn")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("déjà utilisé");
    }

    @Test
    void register_adminRoleRequest_demotedToStudent() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Hacker");
        req.setEmail("hacker@eduai.tn");
        req.setPassword("Pass1234!");
        req.setRole(UserRole.ADMIN);

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");
        User saved = User.builder().name("Hacker").email("hacker@eduai.tn")
                .role(UserRole.STUDENT).active(true).build();
        when(userRepository.save(any())).thenReturn(saved);
        when(jwtService.generateToken(anyMap(), any())).thenReturn("t");
        when(jwtService.generateRefreshToken(any())).thenReturn("r");
        doNothing().when(emailService).sendWelcomeEmail(anyString(), anyString());

        AuthResponse res = authService.register(req);
        assertThat(res.getRole()).isEqualTo(UserRole.STUDENT);
    }

    @Test
    void login_validCredentials_returnsTokens() {
        LoginRequest req = new LoginRequest();
        req.setEmail("test@eduai.tn");
        req.setPassword("Password1!");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(null);
        when(userRepository.findByEmail("test@eduai.tn")).thenReturn(Optional.of(mockUser));
        when(jwtService.generateToken(anyMap(), any())).thenReturn("access");
        when(jwtService.generateRefreshToken(any())).thenReturn("refresh");

        AuthResponse res = authService.login(req);
        assertThat(res.getToken()).isEqualTo("access");
        assertThat(res.getRefreshToken()).isEqualTo("refresh");
    }
}
