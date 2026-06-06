package com.eduai.lms.service;

import com.eduai.lms.model.PasswordResetToken;
import com.eduai.lms.model.User;
import com.eduai.lms.repository.PasswordResetTokenRepository;
import com.eduai.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void requestReset(String email) {
        // Always return success to avoid email enumeration
        userRepository.findByEmail(email).ifPresent(user -> {
            tokenRepository.deleteAllByEmail(email);

            String rawToken = UUID.randomUUID().toString().replace("-", "") +
                              UUID.randomUUID().toString().replace("-", "");

            PasswordResetToken prt = PasswordResetToken.builder()
                    .token(rawToken)
                    .email(email)
                    .expiresAt(Instant.now().plus(15, ChronoUnit.MINUTES))
                    .build();

            tokenRepository.save(prt);
            emailService.sendPasswordResetEmail(email, user.getName(), rawToken);
            log.info("Password reset requested for {}", email);
        });
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken prt = tokenRepository.findByTokenAndUsedFalse(token)
                .orElseThrow(() -> new IllegalArgumentException("Lien invalide ou expiré"));

        if (prt.isExpired()) {
            tokenRepository.delete(prt);
            throw new IllegalArgumentException("Ce lien de réinitialisation a expiré");
        }

        User user = userRepository.findByEmail(prt.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        prt.setUsed(true);
        tokenRepository.save(prt);

        log.info("Password reset successful for {}", user.getEmail());
    }

    @Scheduled(cron = "0 0 * * * *") // every hour
    @Transactional
    public void purgeExpiredTokens() {
        tokenRepository.deleteExpiredTokens(Instant.now());
    }
}
