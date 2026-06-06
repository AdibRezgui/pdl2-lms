package com.eduai.lms.controller;

import com.eduai.lms.dto.response.ApiResponse;
import com.eduai.lms.dto.response.CourseResponse;
import com.eduai.lms.model.Enrollment;
import com.eduai.lms.model.User;
import com.eduai.lms.repository.CourseRepository;
import com.eduai.lms.repository.EnrollmentRepository;
import com.eduai.lms.repository.QuizAttemptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Slf4j
public class AiController {

    private final RestTemplate restTemplate;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    @Value("${app.ai-service.url}")
    private String aiServiceUrl;

    @GetMapping("/recommend")
    public ResponseEntity<ApiResponse<Map<String, Object>>> recommend(
            @AuthenticationPrincipal User user) {

        List<Enrollment> enrollments = enrollmentRepository.findByUser(user);
        List<String> enrolledIds = enrollments.stream()
                .map(e -> e.getCourse().getId().toString()).toList();

        List<CourseResponse> allCourses = courseRepository.findByPublishedTrue(
                org.springframework.data.domain.PageRequest.of(0, 100))
                .stream().map(CourseResponse::from).toList();

        Map<String, Object> body = new HashMap<>();
        body.put("enrolledCourseIds", enrolledIds);
        body.put("allCourses", allCourses);
        body.put("studentProfile", Map.of("name", user.getName()));
        body.put("topN", 5);

        return proxyToAi("/ai/recommend", body);
    }

    @GetMapping("/analyze")
    public ResponseEntity<ApiResponse<Map<String, Object>>> analyze(
            @AuthenticationPrincipal User user) {

        List<Enrollment> enrollments = enrollmentRepository.findByUser(user);
        List<Map<String, Object>> enrollmentData = enrollments.stream().map(e -> {
            Map<String, Object> m = new HashMap<>();
            m.put("courseId", e.getCourse().getId().toString());
            m.put("courseTitle", e.getCourse().getTitle());
            m.put("category", e.getCourse().getCategory());
            m.put("progress", e.getProgress());
            m.put("completed", e.isCompleted());
            return m;
        }).toList();

        List<Map<String, Object>> attemptData = quizAttemptRepository
                .findByUser(user).stream().map(a -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("quizId", a.getQuiz().getId().toString());
                    m.put("score", a.getScore());
                    m.put("passed", a.isPassed());
                    m.put("category", a.getQuiz().getCourse().getCategory());
                    return m;
                }).toList();

        Map<String, Object> body = new HashMap<>();
        body.put("enrollments", enrollmentData);
        body.put("quizAttempts", attemptData);

        return proxyToAi("/ai/analyze", body);
    }

    @PostMapping("/generate-quiz")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateQuiz(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal User user) {
        return proxyToAi("/ai/generate-quiz", request);
    }

    @PostMapping("/generate-summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateSummary(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal User user) {
        return proxyToAi("/ai/generate-summary", request);
    }

    @SuppressWarnings("unchecked")
    private ResponseEntity<ApiResponse<Map<String, Object>>> proxyToAi(
            String path, Map<String, Object> body) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                    aiServiceUrl + path, HttpMethod.POST, request,
                    new ParameterizedTypeReference<>() {});

            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                return ResponseEntity.ok(ApiResponse.ok(resp.getBody()));
            }
        } catch (Exception e) {
            log.warn("AI service call failed for {}: {}", path, e.getMessage());
        }
        return ResponseEntity.ok(ApiResponse.ok(Map.of("error", "Service IA temporairement indisponible")));
    }
}
