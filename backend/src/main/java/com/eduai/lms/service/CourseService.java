package com.eduai.lms.service;

import com.eduai.lms.dto.request.CourseRequest;
import com.eduai.lms.dto.response.CourseResponse;
import com.eduai.lms.dto.response.PageResponse;
import com.eduai.lms.exception.ResourceNotFoundException;
import com.eduai.lms.model.*;
import com.eduai.lms.model.enums.CourseStatus;
import com.eduai.lms.model.enums.UserRole;
import com.eduai.lms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ReviewRepository reviewRepository;
    private final ModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final LessonCompletionRepository lessonCompletionRepository;

    public PageResponse<CourseResponse> getPublishedCourses(int page, int size, String search, String category, String level) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Course> courses;

        if (search != null && !search.isBlank()) {
            courses = courseRepository.searchPublished(search, pageable);
        } else {
            courses = courseRepository.findPublishedWithFilters(
                (category != null && !category.isBlank()) ? category : null,
                (level != null && !level.isBlank()) ? level : null,
                pageable
            );
        }

        return PageResponse.from(courses.map(CourseResponse::from));
    }

    public CourseResponse getCourseById(UUID id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cours non trouvé: " + id));
        return CourseResponse.from(course);
    }

    public Course getCourseEntityById(UUID id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cours non trouvé: " + id));
    }

    public CourseResponse createCourse(CourseRequest request, User trainer) {
        boolean submitForReview = request.isPublished();
        Course course = Course.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .thumbnail(request.getThumbnail())
                .category(request.getCategory())
                .level(request.getLevel())
                .durationHours(request.getDurationHours())
                .price(request.getPrice())
                .language(request.getLanguage())
                .tags(request.getTags())
                .trainer(trainer)
                .published(false)
                .status(submitForReview ? CourseStatus.PENDING_REVIEW : CourseStatus.DRAFT)
                .build();

        return CourseResponse.from(courseRepository.save(course));
    }

    public CourseResponse updateCourse(UUID id, CourseRequest request, User currentUser) {
        Course course = getCourseEntityById(id);

        if (!currentUser.getRole().equals(UserRole.ADMIN) &&
            !course.getTrainer().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Vous n'êtes pas autorisé à modifier ce cours");
        }

        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setThumbnail(request.getThumbnail());
        course.setCategory(request.getCategory());
        course.setLevel(request.getLevel());
        course.setDurationHours(request.getDurationHours());
        course.setPrice(request.getPrice());
        course.setLanguage(request.getLanguage());
        course.setTags(request.getTags());

        // If the course was rejected and trainer re-edits + submits → back to PENDING_REVIEW
        if (request.isPublished()) {
            course.setStatus(CourseStatus.PENDING_REVIEW);
            course.setRejectionReason(null);
            course.setPublished(false);
        } else if (course.getStatus() == CourseStatus.APPROVED) {
            // Admin already approved: keep published state
        } else {
            course.setStatus(CourseStatus.DRAFT);
            course.setPublished(false);
        }

        return CourseResponse.from(courseRepository.save(course));
    }

    public void deleteCourse(UUID id, User currentUser) {
        Course course = getCourseEntityById(id);

        if (!currentUser.getRole().equals(UserRole.ADMIN) &&
            !course.getTrainer().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Vous n'êtes pas autorisé à supprimer ce cours");
        }

        // Delete quiz attempts → quizzes
        List<Quiz> quizzes = quizRepository.findByCourse(course);
        for (Quiz q : quizzes) {
            quizAttemptRepository.deleteAll(quizAttemptRepository.findByQuiz(q));
        }
        quizRepository.deleteAll(quizzes);

        // Delete lesson completions for all lessons in this course
        List<CourseModule> modules = moduleRepository.findByCourseOrderBySortOrderAsc(course);
        for (CourseModule mod : modules) {
            List<Lesson> lessons = lessonRepository.findByModuleOrderBySortOrderAsc(mod);
            for (Lesson lesson : lessons) {
                lessonCompletionRepository.deleteAll(
                    lessonCompletionRepository.findByLesson(lesson));
            }
        }

        // Delete enrollments and reviews
        enrollmentRepository.deleteAll(
            enrollmentRepository.findByCourse(course, org.springframework.data.domain.Pageable.unpaged()).getContent());
        reviewRepository.deleteAll(reviewRepository.findByCourse(course));

        courseRepository.delete(course);
    }

    public List<CourseResponse> getTrainerCourses(User trainer) {
        return courseRepository.findByTrainer(trainer).stream()
                .map(c -> {
                    CourseResponse r = CourseResponse.from(c);
                    r.setStudentsCount((int) enrollmentRepository.countByCourse(c));
                    return r;
                }).toList();
    }
}
