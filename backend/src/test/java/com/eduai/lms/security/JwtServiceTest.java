package com.eduai.lms.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.assertj.core.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret",
            "test-secret-key-that-is-long-enough-32-chars!!");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 86400000L);
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 604800000L);

        userDetails = new User("alice@test.tn", "pass", Collections.emptyList());
    }

    @Test
    void generateToken_extractUsername_matches() {
        String token = jwtService.generateToken(userDetails);
        assertThat(jwtService.extractUsername(token)).isEqualTo("alice@test.tn");
    }

    @Test
    void isTokenValid_freshToken_returnsTrue() {
        String token = jwtService.generateToken(userDetails);
        assertThat(jwtService.isTokenValid(token, userDetails)).isTrue();
    }

    @Test
    void isTokenValid_wrongUser_returnsFalse() {
        String token = jwtService.generateToken(userDetails);
        UserDetails other = new User("bob@test.tn", "pass", Collections.emptyList());
        assertThat(jwtService.isTokenValid(token, other)).isFalse();
    }

    @Test
    void generateRefreshToken_isRefreshToken_returnsTrue() {
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        assertThat(jwtService.isRefreshToken(refreshToken)).isTrue();
    }

    @Test
    void generateToken_isRefreshToken_returnsFalse() {
        String accessToken = jwtService.generateToken(userDetails);
        assertThat(jwtService.isRefreshToken(accessToken)).isFalse();
    }
}
