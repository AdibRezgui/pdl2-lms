package com.eduai.lms.controller;

import com.eduai.lms.dto.response.ApiResponse;
import com.eduai.lms.dto.response.CourseResponse;
import com.eduai.lms.model.*;
import com.eduai.lms.repository.*;
import com.eduai.lms.service.QuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Slf4j
public class AiController {

    private final RestTemplate restTemplate;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final QuizService quizService;

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

    /**
     * Generate a quiz via AI and save it to the DB.
     * scope = LESSON | MODULE | COURSE
     * scopeId = UUID of the lesson/module/course
     * courseId = UUID of the parent course (always required)
     * count = 10 | 20 | 40
     */
    @PostMapping("/generate-quiz-for")
    @PreAuthorize("hasAnyRole('TRAINER','ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateQuizFor(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal User user) {

        String scope   = (String) request.getOrDefault("scope", "COURSE");
        String scopeId = (String) request.get("scopeId");
        String courseIdStr = (String) request.get("courseId");
        int count = request.containsKey("count") ? ((Number) request.get("count")).intValue() : 10;
        @SuppressWarnings("unchecked")
        List<String> lessonIds = request.containsKey("lessonIds") ? (List<String>) request.get("lessonIds") : null;
        String questionType = (String) request.getOrDefault("questionType", "SINGLE");
        count = Math.min(Math.max(count, 1), 40);

        UUID courseId = UUID.fromString(courseIdStr);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new com.eduai.lms.exception.ResourceNotFoundException("Cours non trouvé"));

        // Build topic string based on scope
        String quizTitle;
        String topic;

        switch (scope) {
            case "LESSON" -> {
                Lesson lesson = lessonRepository.findById(UUID.fromString(scopeId))
                        .orElseThrow(() -> new com.eduai.lms.exception.ResourceNotFoundException("Leçon non trouvée"));
                CourseModule mod = moduleRepository.findById(lesson.getModule() != null
                        ? lesson.getModule().getId() : UUID.randomUUID()).orElse(null);
                String modTitle = mod != null ? mod.getTitle() : "";
                // Send full lesson content (up to 3000 chars) for rich context
                String lessonContent = lesson.getContent() != null
                        ? lesson.getContent().substring(0, Math.min(3000, lesson.getContent().length()))
                        : "";
                topic = "LEÇON: " + lesson.getTitle() + "\n"
                        + "MODULE: " + modTitle + "\n"
                        + "COURS: " + course.getTitle() + "\n"
                        + "TAGS: " + String.join(", ", course.getTags() != null ? course.getTags() : List.of()) + "\n"
                        + "CONTENU:\n" + lessonContent;
                quizTitle = "Quiz IA — " + lesson.getTitle();
            }
            case "MODULE" -> {
                CourseModule mod = moduleRepository.findById(UUID.fromString(scopeId))
                        .orElseThrow(() -> new com.eduai.lms.exception.ResourceNotFoundException("Module non trouvé"));
                // Aggregate lesson titles + content snippets for full context
                StringBuilder sb = new StringBuilder();
                sb.append("MODULE: ").append(mod.getTitle()).append("\n");
                sb.append("COURS: ").append(course.getTitle()).append("\n");
                sb.append("TAGS: ").append(String.join(", ", course.getTags() != null ? course.getTags() : List.of())).append("\n");
                sb.append("LEÇONS:\n");
                List<Lesson> selectedLessons = mod.getLessons();
                if (lessonIds != null && !lessonIds.isEmpty()) {
                    selectedLessons = selectedLessons.stream()
                        .filter(l -> lessonIds.contains(l.getId().toString()))
                        .collect(Collectors.toList());
                }
                int remaining = 4000;
                for (Lesson l : selectedLessons) {
                    sb.append("- ").append(l.getTitle());
                    if (l.getContent() != null && !l.getContent().isBlank() && remaining > 0) {
                        int snip = Math.min(400, Math.min(remaining, l.getContent().length()));
                        sb.append(": ").append(l.getContent(), 0, snip);
                        remaining -= snip;
                    }
                    sb.append("\n");
                }
                topic = sb.toString();
                quizTitle = "Quiz IA — " + mod.getTitle();
            }
            default -> {
                List<CourseModule> modules = moduleRepository.findByCourseOrderBySortOrderAsc(course);
                StringBuilder sb = new StringBuilder();
                sb.append("COURS: ").append(course.getTitle()).append("\n");
                sb.append("CATÉGORIE: ").append(course.getCategory() != null ? course.getCategory() : "").append("\n");
                if (course.getDescription() != null && !course.getDescription().isBlank())
                    sb.append("DESCRIPTION: ").append(course.getDescription(), 0, Math.min(500, course.getDescription().length())).append("\n");
                sb.append("TAGS: ").append(String.join(", ", course.getTags() != null ? course.getTags() : List.of())).append("\n");
                sb.append("MODULES ET LEÇONS:\n");
                int remaining = 5000;
                for (CourseModule m : modules) {
                    sb.append("\nModule: ").append(m.getTitle()).append("\n");
                    // Use repository to reliably load lessons (avoids lazy-load issues)
                    List<Lesson> moduleLessons = lessonRepository.findByModuleOrderBySortOrderAsc(m);
                    if (lessonIds != null && !lessonIds.isEmpty()) {
                        moduleLessons = moduleLessons.stream()
                            .filter(l -> lessonIds.contains(l.getId().toString()))
                            .collect(Collectors.toList());
                    }
                    for (Lesson l : moduleLessons) {
                        sb.append("  - ").append(l.getTitle());
                        if (l.getContent() != null && !l.getContent().isBlank() && remaining > 0) {
                            int snip = Math.min(400, Math.min(remaining, l.getContent().length()));
                            sb.append(": ").append(l.getContent(), 0, snip);
                            remaining -= snip;
                        }
                        sb.append("\n");
                    }
                }
                topic = sb.toString();
                quizTitle = "Quiz Final IA — " + course.getTitle();
            }
        }

        // Call AI service
        Map<String, Object> aiReq = new HashMap<>();
        aiReq.put("topic", topic);
        aiReq.put("courseTitle", course.getTitle());
        aiReq.put("count", count);
        aiReq.put("questionType", questionType.toLowerCase());

        Map<String, Object> aiData = null;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> httpReq = new HttpEntity<>(aiReq, headers);
            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                    aiServiceUrl + "/ai/generate-quiz", HttpMethod.POST, httpReq,
                    new org.springframework.core.ParameterizedTypeReference<>() {});
            if (resp.getStatusCode().is2xxSuccessful()) aiData = resp.getBody();
        } catch (Exception e) {
            log.warn("AI service error: {}", e.getMessage());
        }

        if (aiData == null || !aiData.containsKey("questions")) {
            return ResponseEntity.ok(ApiResponse.error("Service IA temporairement indisponible"));
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rawQuestions = (List<Map<String, Object>>) aiData.get("questions");

        // Remap correctAnswer → correct (expected by QuizService)
        List<Map<String, Object>> questions = rawQuestions.stream().map(q -> {
            Map<String, Object> mapped = new HashMap<>(q);
            if (!mapped.containsKey("correct") && mapped.containsKey("correctAnswer")) {
                mapped.put("correct", mapped.get("correctAnswer"));
            }
            return mapped;
        }).collect(Collectors.toList());

        int timeLimit = count <= 10 ? 15 : count <= 20 ? 25 : 45;
        UUID linkedModuleId = "MODULE".equals(scope) ? UUID.fromString(scopeId) : null;
        Quiz quiz = quizService.createQuiz(courseId, linkedModuleId, quizTitle, timeLimit, 70, questions, user);

        Map<String, Object> result = new HashMap<>();
        result.put("quizId", quiz.getId().toString());
        result.put("title", quiz.getTitle());
        result.put("questionsCount", quiz.getQuestions().size());
        result.put("timeLimit", quiz.getTimeLimit());

        return ResponseEntity.ok(ApiResponse.ok("Quiz généré avec succès", result));
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
