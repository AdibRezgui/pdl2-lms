package com.eduai.lms.service;

import com.eduai.lms.exception.ResourceNotFoundException;
import com.eduai.lms.model.Course;
import com.eduai.lms.model.Enrollment;
import com.eduai.lms.model.Quiz;
import com.eduai.lms.model.User;
import com.eduai.lms.repository.CourseRepository;
import com.eduai.lms.repository.EnrollmentRepository;
import com.eduai.lms.repository.QuizAttemptRepository;
import com.eduai.lms.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    public Enrollment enroll(UUID courseId, User student) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Cours non trouvé"));

        if (enrollmentRepository.existsByUserAndCourse(student, course)) {
            throw new IllegalStateException("Vous êtes déjà inscrit à ce cours");
        }

        Enrollment enrollment = Enrollment.builder()
                .user(student)
                .course(course)
                .progress(0)
                .lastAccessedAt(LocalDateTime.now())
                .build();

        Enrollment saved = enrollmentRepository.save(enrollment);

        course.setStudentsCount(course.getStudentsCount() + 1);
        courseRepository.save(course);

        return saved;
    }

    public List<Enrollment> getMyEnrollments(User student) {
        List<Enrollment> list = enrollmentRepository.findByUser(student);
        // Repair legacy records: badge earned but progress < 100 (created before the auto-fix)
        list.forEach(e -> {
            if (e.isBadgeEarned() && e.getProgress() < 100) {
                e.setProgress(100);
                e.setCompleted(true);
                if (e.getCompletedAt() == null) e.setCompletedAt(LocalDateTime.now());
                enrollmentRepository.save(e);
            }
        });
        return list;
    }

    public Enrollment updateProgress(UUID enrollmentId, int progress, User student) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Inscription non trouvée"));

        if (!enrollment.getUser().getId().equals(student.getId())) {
            throw new IllegalStateException("Accès refusé");
        }

        enrollment.setLastAccessedAt(LocalDateTime.now());

        // Badge already earned: keep progress at 100, never overwrite
        if (enrollment.isBadgeEarned()) {
            enrollment.setProgress(100);
        } else {
            enrollment.setProgress(Math.min(100, Math.max(0, progress)));
            if (progress >= 100 && !enrollment.isCompleted()) {
                enrollment.setCompleted(true);
                enrollment.setCompletedAt(LocalDateTime.now());
            }
        }

        return enrollmentRepository.save(enrollment);
    }

    public Page<Enrollment> getCourseEnrollments(UUID courseId, int page, int size, User trainer) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Cours non trouvé"));
        return enrollmentRepository.findByCourse(course, PageRequest.of(page, size));
    }

    public Enrollment claimBadge(UUID enrollmentId, User student) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Inscription non trouvée"));

        if (!enrollment.getUser().getId().equals(student.getId())) {
            throw new IllegalStateException("Accès refusé");
        }
        if (enrollment.isBadgeEarned()) {
            return enrollment; // already claimed
        }

        Course course = enrollment.getCourse();
        List<Quiz> quizzes = quizRepository.findByCourse(course);

        // All module quizzes must be passed (≥70) by this student
        boolean allModulesPassed = quizzes.stream()
                .filter(q -> q.getModule() != null)
                .allMatch(q -> quizAttemptRepository.findByUserAndQuiz(student, q)
                        .stream().anyMatch(a -> a.isPassed() && a.getScore() >= 70));

        // The course-level final quiz must exist and be passed
        boolean finalPassed = quizzes.stream()
                .filter(q -> q.getModule() == null)
                .anyMatch(q -> quizAttemptRepository.findByUserAndQuiz(student, q)
                        .stream().anyMatch(a -> a.isPassed() && a.getScore() >= 70));

        if (!allModulesPassed || !finalPassed) {
            throw new IllegalStateException("Conditions non remplies pour obtenir le badge");
        }

        enrollment.setBadgeEarned(true);
        enrollment.setCompleted(true);
        enrollment.setProgress(100);
        if (enrollment.getCompletedAt() == null) enrollment.setCompletedAt(LocalDateTime.now());
        return enrollmentRepository.save(enrollment);
    }
}
