package com.eduai.lms;

import com.eduai.lms.model.User;
import com.eduai.lms.model.enums.UserRole;
import com.eduai.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) return;

        log.info("Création des comptes démo...");

        userRepository.save(User.builder()
                .name("Sami Trabelsi").email("admin@eduai.tn")
                .password(passwordEncoder.encode("Demo1234!")).role(UserRole.ADMIN)
                .active(true).build());

        userRepository.save(User.builder()
                .name("Dr. Amira Ben Salah").email("trainer@eduai.tn")
                .password(passwordEncoder.encode("Demo1234!")).role(UserRole.TRAINER)
                .bio("Experte en IA et Machine Learning, 10 ans d'expérience.").active(true).build());

        userRepository.save(User.builder()
                .name("Youssef Mansouri").email("student@eduai.tn")
                .password(passwordEncoder.encode("Demo1234!")).role(UserRole.STUDENT)
                .active(true).build());

        userRepository.save(User.builder()
                .name("Mohamed Khelifi").email("mohamed@eduai.tn")
                .password(passwordEncoder.encode("Demo1234!")).role(UserRole.TRAINER)
                .bio("Développeur Full-Stack senior, spécialisé React et Node.js").active(true).build());

        userRepository.save(User.builder()
                .name("Fatma Gharbi").email("fatma@student.tn")
                .password(passwordEncoder.encode("Demo1234!")).role(UserRole.STUDENT)
                .active(true).build());

        log.info("Comptes démo créés : student@eduai.tn / trainer@eduai.tn / admin@eduai.tn — mot de passe: Demo1234!");
    }
}
