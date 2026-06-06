package com.eduai.lms.controller;

import com.eduai.lms.dto.request.QuizAttemptRequest;
import com.eduai.lms.dto.response.ApiResponse;
import com.eduai.lms.model.Enrollment;
import com.eduai.lms.model.Quiz;
import com.eduai.lms.model.QuizAttempt;
import com.eduai.lms.model.User;
import com.eduai.lms.repository.EnrollmentRepository;
import com.eduai.lms.repository.QuizAttemptRepository;
import com.eduai.lms.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;
    private final EnrollmentRepository enrollmentRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final com.eduai.lms.repository.QuizRepository quizRepository;

    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<List<Quiz>>> getByCourse(@PathVariable UUID courseId) {
        return ResponseEntity.ok(ApiResponse.ok(quizService.getQuizzesByCourse(courseId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Quiz>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(quizService.getQuizById(id)));
    }

    @PostMapping("/attempts")
    public ResponseEntity<ApiResponse<QuizAttempt>> submitAttempt(
            @Valid @RequestBody QuizAttemptRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok("Résultat enregistré",
            quizService.submitAttempt(request, user)));
    }

    @GetMapping("/attempts/me")
    public ResponseEntity<ApiResponse<List<QuizAttempt>>> myAttempts(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(quizService.getMyAttempts(user)));
    }

    /** Create a quiz (trainer) */
    @PostMapping
    public ResponseEntity<ApiResponse<Quiz>> createQuiz(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {
        UUID courseId = UUID.fromString((String) body.get("courseId"));
        String title = (String) body.get("title");
        int timeLimit = body.containsKey("timeLimit") ? (int) body.get("timeLimit") : 15;
        int passingScore = body.containsKey("passingScore") ? (int) body.get("passingScore") : 70;
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> questions = (List<Map<String, Object>>) body.get("questions");
        Quiz quiz = quizService.createQuiz(courseId, title, timeLimit, passingScore, questions, user);
        return ResponseEntity.ok(ApiResponse.ok("Quiz créé avec succès", quiz));
    }

    /** All quizzes from courses the student is enrolled in, with their attempt history */
    @GetMapping("/my-courses")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> quizzesForMyEnrollments(
            @AuthenticationPrincipal User user) {

        List<Enrollment> enrollments = enrollmentRepository.findByUser(user);
        List<com.eduai.lms.model.Course> courses = enrollments.stream()
                .map(Enrollment::getCourse).collect(Collectors.toList());
        List<Quiz> quizzes = quizRepository.findByCoursesIn(courses);
        List<QuizAttempt> myAttempts = quizAttemptRepository.findByUser(user);

        List<Map<String, Object>> result = quizzes.stream().map(q -> {
            List<QuizAttempt> qAttempts = myAttempts.stream()
                    .filter(a -> a.getQuiz().getId().equals(q.getId()))
                    .collect(Collectors.toList());
            int lastScore = qAttempts.isEmpty() ? -1 : qAttempts.get(qAttempts.size() - 1).getScore();
            boolean passed = qAttempts.stream().anyMatch(QuizAttempt::isPassed);

            Map<String, Object> m = new HashMap<>();
            m.put("id", q.getId().toString());
            m.put("title", q.getTitle());
            m.put("courseTitle", q.getCourse() != null ? q.getCourse().getTitle() : "");
            m.put("courseId", q.getCourse() != null ? q.getCourse().getId().toString() : null);
            m.put("questionsCount", q.getQuestions().size());
            m.put("timeLimit", q.getTimeLimit());
            m.put("passingScore", q.getPassingScore());
            m.put("maxAttempts", q.getMaxAttempts());
            m.put("attemptsCount", qAttempts.size());
            m.put("lastScore", lastScore);
            m.put("passed", passed);
            m.put("questions", q.getQuestions());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
