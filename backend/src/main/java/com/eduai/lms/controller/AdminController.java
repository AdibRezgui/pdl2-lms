package com.eduai.lms.controller;

import com.eduai.lms.dto.response.ApiResponse;
import com.eduai.lms.dto.response.CourseResponse;
import com.eduai.lms.dto.response.PageResponse;
import com.eduai.lms.dto.response.UserResponse;
import com.eduai.lms.model.enums.UserRole;
import com.eduai.lms.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getPlatformStats()));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> users(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllUsers(page, size, search)));
    }

    @PutMapping("/users/{id}/toggle-active")
    public ResponseEntity<ApiResponse<UserResponse>> toggleActive(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.toggleUserActive(id)));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> changeRole(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        UserRole newRole = UserRole.valueOf(body.get("role").toUpperCase());
        return ResponseEntity.ok(ApiResponse.ok(adminService.updateUserRole(id, newRole)));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.ok("Utilisateur supprimé", null));
    }

    @GetMapping("/courses")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> allCourses() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllCourses()));
    }

    @GetMapping("/courses/pending")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> pendingCourses() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getPendingCourses()));
    }

    @PutMapping("/courses/{id}/approve")
    public ResponseEntity<ApiResponse<CourseResponse>> approveCourse(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Cours approuvé", adminService.approveCourse(id)));
    }

    @PutMapping("/courses/{id}/reject")
    public ResponseEntity<ApiResponse<CourseResponse>> rejectCourse(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "Non conforme aux standards de la plateforme");
        return ResponseEntity.ok(ApiResponse.ok("Cours rejeté", adminService.rejectCourse(id, reason)));
    }
}
