package com.eduai.lms.controller;

import com.eduai.lms.model.User;
import com.eduai.lms.model.enums.UserRole;
import com.eduai.lms.repository.UserRepository;
import com.eduai.lms.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminControllerIT {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired JwtService jwtService;
    @Autowired PasswordEncoder passwordEncoder;

    private String adminToken;

    @BeforeEach
    void setUp() {
        User admin = User.builder()
                .name("Admin Test")
                .email("admin-it@test.com")
                .password(passwordEncoder.encode("password"))
                .role(UserRole.ADMIN)
                .active(true)
                .build();
        userRepository.save(admin);
        adminToken = jwtService.generateToken(admin);
    }

    @Test
    void getPlatformStats_withAdminToken_returns200() throws Exception {
        mockMvc.perform(get("/admin/stats")
                        .header("Authorization", "Bearer " + adminToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalUsers").isNumber());
    }

    @Test
    void getAllUsers_withAdminToken_returnsList() throws Exception {
        mockMvc.perform(get("/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    void getPlatformStats_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/admin/stats")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getPendingCourses_withAdminToken_returnsList() throws Exception {
        mockMvc.perform(get("/admin/courses/pending")
                        .header("Authorization", "Bearer " + adminToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }
}
