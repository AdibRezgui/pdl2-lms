package com.eduai.lms.controller;

import com.eduai.lms.dto.request.CourseRequest;
import com.eduai.lms.dto.response.ApiResponse;
import com.eduai.lms.dto.response.CourseResponse;
import com.eduai.lms.dto.response.PageResponse;
import com.eduai.lms.model.User;
import com.eduai.lms.service.CourseService;
import com.eduai.lms.service.FileStorageService;
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

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CourseResponse>>> getPublished(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String level) {
        return ResponseEntity.ok(ApiResponse.ok(
            courseService.getPublishedCourses(page, size, search, category, level)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(courseService.getCourseById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CourseResponse>> create(
            @Valid @RequestBody CourseRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok("Cours créé", courseService.createCourse(request, user)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CourseRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok("Cours mis à jour", courseService.updateCourse(id, request, user)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        courseService.deleteCourse(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Cours supprimé", null));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> myCourses(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(courseService.getTrainerCourses(user)));
    }

    @PostMapping(value = "/upload-thumbnail", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('TRAINER','ADMIN')")
    public ResponseEntity<ApiResponse<String>> uploadThumbnail(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {
        String url = fileStorageService.storeThumbnail(file);
        return ResponseEntity.ok(ApiResponse.ok("Image uploadée", url));
    }
}
