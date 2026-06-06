package com.eduai.lms.controller;

import com.eduai.lms.dto.request.ModuleRequest;
import com.eduai.lms.dto.response.ApiResponse;
import com.eduai.lms.model.CourseModule;
import com.eduai.lms.model.User;
import com.eduai.lms.service.ModuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ModuleController {

    private final ModuleService moduleService;

    @GetMapping("/courses/{courseId}/modules")
    public ResponseEntity<ApiResponse<List<CourseModule>>> getByCourse(@PathVariable UUID courseId) {
        return ResponseEntity.ok(ApiResponse.ok(moduleService.getModulesByCourse(courseId)));
    }

    @PostMapping("/courses/{courseId}/modules")
    public ResponseEntity<ApiResponse<CourseModule>> create(
            @PathVariable UUID courseId,
            @Valid @RequestBody ModuleRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok("Module créé",
            moduleService.createModule(courseId, request, user)));
    }

    @PutMapping("/modules/{id}")
    public ResponseEntity<ApiResponse<CourseModule>> update(
            @PathVariable UUID id,
            @Valid @RequestBody ModuleRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok("Module mis à jour",
            moduleService.updateModule(id, request, user)));
    }

    @DeleteMapping("/modules/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        moduleService.deleteModule(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Module supprimé", null));
    }
}
