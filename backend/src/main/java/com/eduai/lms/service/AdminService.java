package com.eduai.lms.service;

import com.eduai.lms.dto.response.CourseResponse;
import com.eduai.lms.dto.response.PageResponse;
import com.eduai.lms.dto.response.UserResponse;
import com.eduai.lms.exception.ResourceNotFoundException;
import com.eduai.lms.model.Course;
import com.eduai.lms.model.User;
import com.eduai.lms.model.enums.CourseStatus;
import com.eduai.lms.model.enums.UserRole;
import com.eduai.lms.repository.CourseRepository;
import com.eduai.lms.repository.EnrollmentRepository;
import com.eduai.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;

    public Map<String, Object> getPlatformStats() {
        long totalEnrollments = enrollmentRepository.count();
        long completedEnrollments = enrollmentRepository.countByCompleted(true);
        int completionRate = totalEnrollments > 0
                ? (int) (completedEnrollments * 100 / totalEnrollments) : 0;

        List<User> recentUsers = userRepository.findAll(
                PageRequest.of(0, 5, Sort.by("createdAt").descending())).getContent();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalStudents", userRepository.countByRole(UserRole.STUDENT));
        stats.put("totalTrainers", userRepository.countByRole(UserRole.TRAINER));
        stats.put("totalCourses", courseRepository.count());
        stats.put("publishedCourses", courseRepository.countByPublishedTrue());
        stats.put("pendingCourses", courseRepository.countByStatus(CourseStatus.PENDING_REVIEW));
        stats.put("totalEnrollments", totalEnrollments);
        stats.put("completedEnrollments", completedEnrollments);
        stats.put("completionRate", completionRate);
        // revenue removed — platform is free
        stats.put("recentUsers", recentUsers.stream().map(UserResponse::from).toList());
        return stats;
    }

    public PageResponse<UserResponse> getAllUsers(int page, int size, String search) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> users = (search != null && !search.isBlank())
                ? userRepository.search(search, pageable)
                : userRepository.findAll(pageable);
        return PageResponse.from(users.map(UserResponse::from));
    }

    public UserResponse toggleUserActive(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
        user.setActive(!user.isActive());
        return UserResponse.from(userRepository.save(user));
    }

    public void deleteUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
        userRepository.delete(user);
    }

    public UserResponse updateUserRole(UUID userId, UserRole newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
        user.setRole(newRole);
        return UserResponse.from(userRepository.save(user));
    }

    public List<CourseResponse> getPendingCourses() {
        return courseRepository.findByStatus(CourseStatus.PENDING_REVIEW)
                .stream().map(CourseResponse::from).toList();
    }

    public List<CourseResponse> getAllCourses() {
        return courseRepository.findAll(
                org.springframework.data.domain.Sort.by("createdAt").descending())
                .stream().map(CourseResponse::from).toList();
    }

    public CourseResponse approveCourse(UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Cours non trouvé"));
        course.setStatus(CourseStatus.APPROVED);
        course.setPublished(true);
        course.setRejectionReason(null);
        return CourseResponse.from(courseRepository.save(course));
    }

    public CourseResponse rejectCourse(UUID courseId, String reason) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Cours non trouvé"));
        course.setStatus(CourseStatus.REJECTED);
        course.setPublished(false);
        course.setRejectionReason(reason);
        return CourseResponse.from(courseRepository.save(course));
    }
}
