package com.eduai.lms.service;

import com.eduai.lms.dto.request.CourseRequest;
import com.eduai.lms.dto.response.CourseResponse;
import com.eduai.lms.exception.ResourceNotFoundException;
import com.eduai.lms.model.Course;
import com.eduai.lms.model.User;
import com.eduai.lms.model.enums.CourseStatus;
import com.eduai.lms.model.enums.UserRole;
import com.eduai.lms.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock CourseRepository courseRepository;
    @Mock EnrollmentRepository enrollmentRepository;
    @Mock QuizRepository quizRepository;
    @Mock QuizAttemptRepository quizAttemptRepository;
    @Mock ReviewRepository reviewRepository;
    @Mock ModuleRepository moduleRepository;
    @Mock LessonRepository lessonRepository;
    @Mock LessonCompletionRepository lessonCompletionRepository;

    @InjectMocks CourseService courseService;

    private User trainer;
    private Course course;
    private UUID courseId;

    @BeforeEach
    void setUp() {
        courseId = UUID.randomUUID();
        trainer = User.builder()
                .id(UUID.randomUUID())
                .name("Trainer Test")
                .email("trainer@test.com")
                .role(UserRole.TRAINER)
                .active(true)
                .build();
        course = Course.builder()
                .id(courseId)
                .title("Test Course")
                .description("A test course description")
                .category("Informatique")
                .level("Débutant")
                .price(BigDecimal.ZERO)
                .trainer(trainer)
                .published(false)
                .status(CourseStatus.DRAFT)
                .build();
    }

    @Test
    void createCourse_withPublished_shouldSetPendingReview() {
        CourseRequest req = new CourseRequest();
        req.setTitle("Mon cours");
        req.setDescription("Description");
        req.setCategory("Informatique");
        req.setLevel("Débutant");
        req.setPublished(true);

        when(courseRepository.save(any(Course.class))).thenAnswer(inv -> {
            Course c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        CourseResponse response = courseService.createCourse(req, trainer);

        assertThat(response.getStatus()).isEqualTo(CourseStatus.PENDING_REVIEW);
        assertThat(response.isPublished()).isFalse();
    }

    @Test
    void createCourse_withoutPublished_shouldSetDraft() {
        CourseRequest req = new CourseRequest();
        req.setTitle("Brouillon");
        req.setDescription("Desc");
        req.setPublished(false);

        when(courseRepository.save(any(Course.class))).thenAnswer(inv -> {
            Course c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        CourseResponse response = courseService.createCourse(req, trainer);

        assertThat(response.getStatus()).isEqualTo(CourseStatus.DRAFT);
    }

    @Test
    void getCourseById_found_returnsCourseResponse() {
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));

        CourseResponse response = courseService.getCourseById(courseId);

        assertThat(response.getTitle()).isEqualTo("Test Course");
        assertThat(response.getStatus()).isEqualTo(CourseStatus.DRAFT);
    }

    @Test
    void getCourseById_notFound_throwsResourceNotFoundException() {
        UUID missing = UUID.randomUUID();
        when(courseRepository.findById(missing)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.getCourseById(missing))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getPublishedCourses_returnsPaginatedResults() {
        Page<Course> page = new PageImpl<>(List.of(course));
        when(courseRepository.findPublishedWithFilters(any(), any(), any(Pageable.class)))
                .thenReturn(page);

        var result = courseService.getPublishedCourses(0, 10, null, null, null);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getPublishedCourses_withSearch_usesSearchQuery() {
        Page<Course> page = new PageImpl<>(List.of(course));
        when(courseRepository.searchPublished(eq("test"), any(Pageable.class))).thenReturn(page);

        var result = courseService.getPublishedCourses(0, 10, "test", null, null);

        assertThat(result.getContent()).hasSize(1);
        verify(courseRepository, never()).findPublishedWithFilters(any(), any(), any());
    }

    @Test
    void deleteCourse_byOwner_succeeds() {
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        // deleteCourse pages through enrollments before deleting them
        when(enrollmentRepository.findByCourse(any(), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of()));

        assertThatNoException().isThrownBy(() -> courseService.deleteCourse(courseId, trainer));
        verify(courseRepository).delete(course);
    }

    @Test
    void deleteCourse_byOtherTrainer_throwsAccessDeniedException() {
        User other = User.builder()
                .id(UUID.randomUUID())
                .role(UserRole.TRAINER)
                .build();
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> courseService.deleteCourse(courseId, other))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }
}
