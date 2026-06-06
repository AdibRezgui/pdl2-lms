package com.eduai.lms.service;

import com.eduai.lms.model.PasswordResetToken;
import com.eduai.lms.model.User;
import com.eduai.lms.model.enums.UserRole;
import com.eduai.lms.repository.PasswordResetTokenRepository;
import com.eduai.lms.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock PasswordResetTokenRepository tokenRepository;
    @Mock UserRepository userRepository;
    @Mock EmailService emailService;
    @Mock PasswordEncoder passwordEncoder;

    @InjectMocks PasswordResetService passwordResetService;

    @Test
    void requestReset_existingEmail_savesTokenAndSendsEmail() {
        User user = User.builder().name("Alice").email("alice@test.tn")
                .role(UserRole.STUDENT).active(true).build();
        when(userRepository.findByEmail("alice@test.tn")).thenReturn(Optional.of(user));
        doNothing().when(tokenRepository).deleteAllByEmail(anyString());
        when(tokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        doNothing().when(emailService).sendPasswordResetEmail(anyString(), anyString(), anyString());

        passwordResetService.requestReset("alice@test.tn");

        verify(tokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).sendPasswordResetEmail(eq("alice@test.tn"), eq("Alice"), anyString());
    }

    @Test
    void requestReset_unknownEmail_silentlyIgnored() {
        when(userRepository.findByEmail("ghost@test.tn")).thenReturn(Optional.empty());

        assertThatNoException().isThrownBy(() -> passwordResetService.requestReset("ghost@test.tn"));
        verify(tokenRepository, never()).save(any());
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString(), anyString());
    }

    @Test
    void resetPassword_validToken_updatesPassword() {
        User user = User.builder().email("bob@test.tn").password("old").active(true).build();
        PasswordResetToken prt = PasswordResetToken.builder()
                .token("abc123")
                .email("bob@test.tn")
                .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES))
                .used(false)
                .build();

        when(tokenRepository.findByTokenAndUsedFalse("abc123")).thenReturn(Optional.of(prt));
        when(userRepository.findByEmail("bob@test.tn")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("NewPass1!")).thenReturn("hashed");
        when(userRepository.save(any())).thenReturn(user);
        when(tokenRepository.save(any())).thenReturn(prt);

        passwordResetService.resetPassword("abc123", "NewPass1!");

        assertThat(user.getPassword()).isEqualTo("hashed");
        assertThat(prt.isUsed()).isTrue();
    }

    @Test
    void resetPassword_expiredToken_throwsException() {
        PasswordResetToken prt = PasswordResetToken.builder()
                .token("expired")
                .email("bob@test.tn")
                .expiresAt(Instant.now().minus(1, ChronoUnit.HOURS))
                .used(false)
                .build();

        when(tokenRepository.findByTokenAndUsedFalse("expired")).thenReturn(Optional.of(prt));
        doNothing().when(tokenRepository).delete(any());

        assertThatThrownBy(() -> passwordResetService.resetPassword("expired", "NewPass1!"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("expiré");
    }

    @Test
    void resetPassword_invalidToken_throwsException() {
        when(tokenRepository.findByTokenAndUsedFalse("bad")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> passwordResetService.resetPassword("bad", "Pass"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("invalide");
    }
}
