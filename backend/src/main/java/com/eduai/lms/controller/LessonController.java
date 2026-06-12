package com.eduai.lms.controller;

import com.eduai.lms.dto.request.LessonRequest;
import com.eduai.lms.dto.response.ApiResponse;
import com.eduai.lms.model.Lesson;
import com.eduai.lms.model.LessonCompletion;
import com.eduai.lms.model.User;
import com.eduai.lms.repository.LessonCompletionRepository;
import com.eduai.lms.repository.LessonRepository;
import com.eduai.lms.service.FileStorageService;
import com.eduai.lms.service.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;
    private final FileStorageService fileStorageService;
    private final LessonRepository lessonRepository;
    private final LessonCompletionRepository lessonCompletionRepository;

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

    /** Mark a lesson as completed by the current student */
    @PostMapping("/lessons/{id}/complete")
    public ResponseEntity<ApiResponse<Void>> markComplete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new com.eduai.lms.exception.ResourceNotFoundException("Leçon non trouvée"));
        if (!lessonCompletionRepository.existsByUserAndLesson(user, lesson)) {
            lessonCompletionRepository.save(
                LessonCompletion.builder().user(user).lesson(lesson).build());
        }
        return ResponseEntity.ok(ApiResponse.ok("Leçon complétée", null));
    }

    /** Return all lesson IDs completed by the current student for a given enrollment */
    @GetMapping("/enrollments/{enrollmentId}/completed-lessons")
    public ResponseEntity<ApiResponse<List<UUID>>> completedLessons(
            @PathVariable UUID enrollmentId,
            @AuthenticationPrincipal User user) {
        List<LessonCompletion> completions = lessonCompletionRepository.findByUser(user);
        List<UUID> ids = completions.stream()
                .map(lc -> lc.getLesson().getId())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(ids));
    }

    @PostMapping(value = "/lessons/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('TRAINER','ADMIN')")
    public ResponseEntity<ApiResponse<String>> uploadContent(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {
        String url = fileStorageService.storeCourseFile(file);
        return ResponseEntity.ok(ApiResponse.ok("Fichier uploadé", url));
    }
}
