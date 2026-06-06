package com.eduai.lms;

import com.eduai.lms.model.Course;
import com.eduai.lms.model.User;
import com.eduai.lms.model.enums.UserRole;
import com.eduai.lms.repository.CourseRepository;
import com.eduai.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) return;

        log.info("Initialisation des données de démonstration...");

        // ── Comptes démo (identiques au login page) ──────────────────────────
        User admin = userRepository.save(User.builder()
                .name("Sami Trabelsi").email("admin@eduai.tn")
                .password(passwordEncoder.encode("Demo1234!")).role(UserRole.ADMIN)
                .avatar("https://api.dicebear.com/7.x/avataaars/svg?seed=admin1").active(true).build());

        User trainer1 = userRepository.save(User.builder()
                .name("Dr. Amira Ben Salah").email("trainer@eduai.tn")
                .password(passwordEncoder.encode("Demo1234!")).role(UserRole.TRAINER)
                .avatar("https://api.dicebear.com/7.x/avataaars/svg?seed=trainer1")
                .bio("Experte en IA et Machine Learning, 10 ans d'expérience.").active(true).build());

        User student1 = userRepository.save(User.builder()
                .name("Youssef Mansouri").email("student@eduai.tn")
                .password(passwordEncoder.encode("Demo1234!")).role(UserRole.STUDENT)
                .avatar("https://api.dicebear.com/7.x/avataaars/svg?seed=student1").active(true).build());

        // ── Comptes supplémentaires ──────────────────────────────────────────
        User trainer2 = userRepository.save(User.builder()
                .name("Mohamed Khelifi").email("mohamed@eduai.tn")
                .password(passwordEncoder.encode("Demo1234!")).role(UserRole.TRAINER)
                .avatar("https://api.dicebear.com/7.x/avataaars/svg?seed=trainer2")
                .bio("Développeur Full-Stack senior, spécialisé React et Node.js").active(true).build());

        userRepository.save(User.builder()
                .name("Fatma Gharbi").email("fatma@student.tn")
                .password(passwordEncoder.encode("Demo1234!")).role(UserRole.STUDENT)
                .avatar("https://api.dicebear.com/7.x/avataaars/svg?seed=student2").active(true).build());

        courseRepository.save(Course.builder()
                .title("Intelligence Artificielle & Machine Learning avec Python")
                .description("Maîtrisez les fondamentaux de l'IA et du ML. De la régression aux réseaux de neurones profonds.")
                .thumbnail("https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80")
                .category("Intelligence Artificielle").level("Intermédiaire")
                .durationHours(42).price(BigDecimal.ZERO).language("Français")
                .tags(List.of("Python", "ML", "Deep Learning", "TensorFlow"))
                .trainer(trainer1).published(true).studentsCount(1248).rating(4.9).ratingsCount(387).build());

        courseRepository.save(Course.builder()
                .title("Développement Full-Stack React & Spring Boot")
                .description("Construisez des applications web modernes de A à Z. Frontend React, Backend Spring Boot, PostgreSQL.")
                .thumbnail("https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80")
                .category("Développement Web").level("Intermédiaire")
                .durationHours(56).price(BigDecimal.ZERO).language("Français")
                .tags(List.of("React", "Spring Boot", "TypeScript", "PostgreSQL"))
                .trainer(trainer2).published(true).studentsCount(892).rating(4.8).ratingsCount(234).build());

        courseRepository.save(Course.builder()
                .title("DevOps : Docker, Kubernetes & CI/CD")
                .description("Maîtrisez l'orchestration de conteneurs, la livraison continue et les pratiques DevOps modernes.")
                .thumbnail("https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&q=80")
                .category("DevOps").level("Avancé")
                .durationHours(38).price(BigDecimal.ZERO).language("Français")
                .tags(List.of("Docker", "Kubernetes", "Jenkins", "CI/CD"))
                .trainer(trainer1).published(true).studentsCount(456).rating(4.7).ratingsCount(128).build());

        log.info("Données initialisées : comptes démo student@eduai.tn / trainer@eduai.tn / admin@eduai.tn — mot de passe: Demo1234!");
    }
}
