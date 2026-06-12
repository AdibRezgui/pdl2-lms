package com.eduai.lms.controller;

import com.eduai.lms.dto.response.ApiResponse;
import com.eduai.lms.dto.response.PageResponse;
import com.eduai.lms.model.Enrollment;
import com.eduai.lms.model.User;
import com.eduai.lms.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping
    public ResponseEntity<ApiResponse<Enrollment>> enroll(
            @RequestBody Map<String, UUID> body,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok("Inscription réussie",
            enrollmentService.enroll(body.get("courseId"), user)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<Enrollment>>> myEnrollments(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(enrollmentService.getMyEnrollments(user)));
    }

    @PutMapping("/{id}/progress")
    public ResponseEntity<ApiResponse<Enrollment>> updateProgress(
            @PathVariable UUID id,
            @RequestBody Map<String, Integer> body,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok("Progression mise à jour",
            enrollmentService.updateProgress(id, body.getOrDefault("progress", 0), user)));
    }

    @PostMapping("/{id}/claim-badge")
    public ResponseEntity<ApiResponse<Enrollment>> claimBadge(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok("Badge obtenu !", enrollmentService.claimBadge(id, user)));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<PageResponse<Enrollment>>> courseEnrollments(
            @PathVariable UUID courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(
            PageResponse.from(enrollmentService.getCourseEnrollments(courseId, page, size, user))));
    }
}
