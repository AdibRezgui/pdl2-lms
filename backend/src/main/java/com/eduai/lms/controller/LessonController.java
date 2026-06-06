package com.eduai.lms.controller;

import com.eduai.lms.dto.request.LessonRequest;
import com.eduai.lms.dto.response.ApiResponse;
import com.eduai.lms.model.Lesson;
import com.eduai.lms.model.User;
import com.eduai.lms.service.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    @GetMapping("/modules/{moduleId}/lessons")
    public ResponseEntity<ApiResponse<List<Lesson>>> getByModule(@PathVariable UUID moduleId) {
        return ResponseEntity.ok(ApiResponse.ok(lessonService.getLessonsByModule(moduleId)));
    }

    @PostMapping("/modules/{moduleId}/lessons")
    public ResponseEntity<ApiResponse<Lesson>> create(
            @PathVariable UUID moduleId,
            @Valid @RequestBody LessonRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok("Leçon créée",
            lessonService.createLesson(moduleId, request, user)));
    }

    @PutMapping("/lessons/{id}")
    public ResponseEntity<ApiResponse<Lesson>> update(
            @PathVariable UUID id,
            @Valid @RequestBody LessonRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok("Leçon mise à jour",
            lessonService.updateLesson(id, request, user)));
    }

    @DeleteMapping("/lessons/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        lessonService.deleteLesson(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Leçon supprimée", null));
    }
}
