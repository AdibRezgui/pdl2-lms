package com.eduai.lms.service;

import com.eduai.lms.exception.ResourceNotFoundException;
import com.eduai.lms.model.Course;
import com.eduai.lms.model.Enrollment;
import com.eduai.lms.model.User;
import com.eduai.lms.repository.CourseRepository;
import com.eduai.lms.repository.EnrollmentRepository;
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
        return enrollmentRepository.findByUser(student);
    }

    public Enrollment updateProgress(UUID enrollmentId, int progress, User student) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Inscription non trouvée"));

        if (!enrollment.getUser().getId().equals(student.getId())) {
            throw new IllegalStateException("Accès refusé");
        }

        enrollment.setProgress(Math.min(100, Math.max(0, progress)));
        enrollment.setLastAccessedAt(LocalDateTime.now());

        if (progress >= 100 && !enrollment.isCompleted()) {
            enrollment.setCompleted(true);
            enrollment.setCompletedAt(LocalDateTime.now());
        }

        return enrollmentRepository.save(enrollment);
    }

    public Page<Enrollment> getCourseEnrollments(UUID courseId, int page, int size, User trainer) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Cours non trouvé"));
        return enrollmentRepository.findByCourse(course, PageRequest.of(page, size));
    }
}
