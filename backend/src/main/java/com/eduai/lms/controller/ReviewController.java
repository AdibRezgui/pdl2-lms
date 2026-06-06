package com.eduai.lms.controller;

import com.eduai.lms.dto.request.ReviewRequest;
import com.eduai.lms.dto.response.ApiResponse;
import com.eduai.lms.model.Review;
import com.eduai.lms.model.User;
import com.eduai.lms.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ApiResponse<Review>> addReview(
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok("Avis ajouté", reviewService.addReview(request, user)));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<List<Review>>> getCourseReviews(@PathVariable UUID courseId) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getCourseReviews(courseId)));
    }
}
