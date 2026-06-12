package com.eduai.lms.service;

import com.eduai.lms.dto.response.CourseResponse;
import com.eduai.lms.dto.response.UserResponse;
import com.eduai.lms.exception.ResourceNotFoundException;
import com.eduai.lms.model.Course;
import com.eduai.lms.model.User;
import com.eduai.lms.model.enums.CourseStatus;
import com.eduai.lms.model.enums.UserRole;
import com.eduai.lms.repository.CourseRepository;
import com.eduai.lms.repository.EnrollmentRepository;
import com.eduai.lms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock UserRepository userRepository;
    @Mock CourseRepository courseRepository;
    @Mock EnrollmentRepository enrollmentRepository;

    @InjectMocks AdminService adminService;

    private Course pendingCourse;
    private User user;
    private UUID courseId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        courseId = UUID.randomUUID();
        userId = UUID.randomUUID();

        user = User.builder()
                .id(userId)
                .name("Test User")
                .email("user@test.com")
                .role(UserRole.STUDENT)
                .active(true)
                .build();

        pendingCourse = Course.builder()
                .id(courseId)
                .title("Cours en attente")
                .status(CourseStatus.PENDING_REVIEW)
                .published(false)
                .trainer(User.builder().id(UUID.randomUUID()).name("Trainer").build())
                .build();
    }

    @Test
    void getPlatformStats_returnsCorrectKeys() {
        when(enrollmentRepository.count()).thenReturn(100L);
        when(enrollmentRepository.countByCompleted(true)).thenReturn(60L);
        when(userRepository.count()).thenReturn(50L);
        when(userRepository.countByRole(UserRole.STUDENT)).thenReturn(40L);
        when(userRepository.countByRole(UserRole.TRAINER)).thenReturn(5L);
        when(courseRepository.count()).thenReturn(20L);
        when(courseRepository.countByPublishedTrue()).thenReturn(15L);
        when(courseRepository.countByStatus(CourseStatus.PENDING_REVIEW)).thenReturn(3L);
        when(userRepository.findAll(any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));

        Map<String, Object> stats = adminService.getPlatformStats();

        assertThat(stats).containsKeys("totalUsers", "totalStudents", "totalTrainers",
                "totalCourses", "publishedCourses", "pendingCourses",
                "totalEnrollments", "completionRate");
        assertThat(stats).doesNotContainKey("totalRevenue");
        assertThat(stats.get("completionRate")).isEqualTo(60);
    }

    @Test
    void getPlatformStats_zeroEnrollments_completionRateIsZero() {
        when(enrollmentRepository.count()).thenReturn(0L);
        when(enrollmentRepository.countByCompleted(true)).thenReturn(0L);
        when(userRepository.count()).thenReturn(0L);
        when(userRepository.countByRole(any())).thenReturn(0L);
        when(courseRepository.count()).thenReturn(0L);
        when(courseRepository.countByPublishedTrue()).thenReturn(0L);
        when(courseRepository.countByStatus(any())).thenReturn(0L);
        when(userRepository.findAll(any(PageRequest.class))).thenReturn(new PageImpl<>(List.of()));

        Map<String, Object> stats = adminService.getPlatformStats();

        assertThat(stats.get("completionRate")).isEqualTo(0);
    }

    @Test
    void approveCourse_setsCourseApprovedAndPublished() {
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(pendingCourse));
        when(courseRepository.save(pendingCourse)).thenReturn(pendingCourse);

        adminService.approveCourse(courseId);

        assertThat(pendingCourse.getStatus()).isEqualTo(CourseStatus.APPROVED);
        assertThat(pendingCourse.isPublished()).isTrue();
        assertThat(pendingCourse.getRejectionReason()).isNull();
    }

    @Test
    void approveCourse_notFound_throwsException() {
        when(courseRepository.findById(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminService.approveCourse(UUID.randomUUID()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void rejectCourse_setsCourseRejectedWithReason() {
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(pendingCourse));
        when(courseRepository.save(pendingCourse)).thenReturn(pendingCourse);

        adminService.rejectCourse(courseId, "Contenu insuffisant");

        assertThat(pendingCourse.getStatus()).isEqualTo(CourseStatus.REJECTED);
        assertThat(pendingCourse.isPublished()).isFalse();
        assertThat(pendingCourse.getRejectionReason()).isEqualTo("Contenu insuffisant");
    }

    @Test
    void getPendingCourses_returnsPendingOnly() {
        when(courseRepository.findByStatus(CourseStatus.PENDING_REVIEW))
                .thenReturn(List.of(pendingCourse));

        List<CourseResponse> result = adminService.getPendingCourses();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(CourseStatus.PENDING_REVIEW);
    }

    @Test
    void toggleUserActive_flippsActiveState() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        adminService.toggleUserActive(userId);
        assertThat(user.isActive()).isFalse();

        adminService.toggleUserActive(userId);
        assertThat(user.isActive()).isTrue();
    }

    @Test
    void deleteUser_callsRepositoryDelete() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        adminService.deleteUser(userId);

        verify(userRepository).delete(user);
    }

    @Test
    void updateUserRole_changesRole() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        adminService.updateUserRole(userId, UserRole.TRAINER);

        assertThat(user.getRole()).isEqualTo(UserRole.TRAINER);
    }
}
