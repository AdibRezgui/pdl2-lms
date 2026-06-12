package com.eduai.lms.service;

import com.eduai.lms.model.ChatMessage;
import com.eduai.lms.model.Enrollment;
import com.eduai.lms.model.QuizAttempt;
import com.eduai.lms.model.User;
import com.eduai.lms.repository.ChatMessageRepository;
import com.eduai.lms.repository.CourseRepository;
import com.eduai.lms.repository.EnrollmentRepository;
import com.eduai.lms.repository.QuizAttemptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final CourseRepository courseRepository;
    private final RestTemplate restTemplate;

    @Value("${app.ai-service.url}")
    private String aiServiceUrl;

    public ChatMessage saveAndRespond(String userMessage, List<Map<String, String>> history, User user) {
        ChatMessage userMsg = ChatMessage.builder()
                .user(user).role("user").content(userMessage).build();
        chatMessageRepository.save(userMsg);

        String reply = callAiService(userMessage, history != null ? history : List.of(), user);

        ChatMessage assistantMsg = ChatMessage.builder()
                .user(user).role("assistant").content(reply).build();
        return chatMessageRepository.save(assistantMsg);
    }

    public List<ChatMessage> getHistory(User user) {
        return chatMessageRepository.findByUserOrderByCreatedAtAsc(user);
    }

    private Map<String, Object> buildContext(User user) {
        List<Enrollment> enrollments = enrollmentRepository.findByUser(user);
        Set<UUID> enrolledIds = new HashSet<>();
        List<Map<String, Object>> enrollmentData = new ArrayList<>();

        for (Enrollment e : enrollments) {
            enrolledIds.add(e.getCourse().getId());
            Map<String, Object> m = new HashMap<>();
            m.put("courseId", e.getCourse().getId().toString());
            m.put("courseTitle", e.getCourse().getTitle());
            m.put("category", e.getCourse().getCategory() != null ? e.getCourse().getCategory() : "");
            m.put("level", e.getCourse().getLevel() != null ? e.getCourse().getLevel() : "");
            m.put("description", e.getCourse().getDescription() != null
                    ? e.getCourse().getDescription().substring(0, Math.min(200, e.getCourse().getDescription().length()))
                    : "");
            m.put("tags", e.getCourse().getTags());
            m.put("trainerName", e.getCourse().getTrainer() != null ? e.getCourse().getTrainer().getName() : "");
            m.put("progress", e.getProgress());
            m.put("completed", e.isCompleted());
            enrollmentData.add(m);
        }

        // Available courses not yet enrolled
        List<Map<String, Object>> availableCourses = new ArrayList<>();
        courseRepository.findByPublishedTrue(PageRequest.of(0, 100)).forEach(c -> {
            if (!enrolledIds.contains(c.getId())) {
                Map<String, Object> m = new HashMap<>();
                m.put("courseId", c.getId().toString());
                m.put("title", c.getTitle());
                m.put("category", c.getCategory() != null ? c.getCategory() : "");
                m.put("level", c.getLevel() != null ? c.getLevel() : "");
                m.put("description", c.getDescription() != null
                        ? c.getDescription().substring(0, Math.min(150, c.getDescription().length()))
                        : "");
                m.put("tags", c.getTags());
                m.put("trainerName", c.getTrainer() != null ? c.getTrainer().getName() : "");
                m.put("rating", c.getRating());
                m.put("studentsCount", c.getStudentsCount());
                availableCourses.add(m);
            }
        });

        // Quiz attempts — aggregate + per-quiz detail
        List<QuizAttempt> attempts = quizAttemptRepository.findByUser(user);
        long passed = attempts.stream().filter(QuizAttempt::isPassed).count();
        OptionalDouble avg = attempts.stream().mapToInt(QuizAttempt::getScore).average();

        List<Map<String, Object>> quizDetails = new ArrayList<>();
        for (QuizAttempt a : attempts) {
            Map<String, Object> q = new HashMap<>();
            q.put("quizTitle", a.getQuiz().getTitle());
            q.put("courseTitle", a.getQuiz().getCourse().getTitle());
            q.put("score", a.getScore());
            q.put("passed", a.isPassed());
            q.put("completedAt", a.getCompletedAt() != null ? a.getCompletedAt().toString() : "");
            quizDetails.add(q);
        }

        Map<String, Object> ctx = new HashMap<>();
        ctx.put("name", user.getName());
        ctx.put("enrollments", enrollmentData);
        ctx.put("availableCourses", availableCourses);
        ctx.put("totalCourses", enrollments.size());
        ctx.put("completedCourses", enrollments.stream().filter(Enrollment::isCompleted).count());
        ctx.put("totalQuizAttempts", attempts.size());
        ctx.put("passedQuizzes", passed);
        ctx.put("averageQuizScore", avg.isPresent() ? Math.round(avg.getAsDouble()) : 0);
        ctx.put("quizAttempts", quizDetails);
        return ctx;
    }

    private String callAiService(String message, List<Map<String, String>> history, User user) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("message", message);
            body.put("history", history);
            body.put("userContext", buildContext(user));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                aiServiceUrl + "/ai/chat", HttpMethod.POST, request,
                new org.springframework.core.ParameterizedTypeReference<>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object reply = response.getBody().get("response");
                return reply instanceof String s ? s : fallbackReply(message);
            }
        } catch (Exception e) {
            log.warn("AI service unavailable, using fallback: {}", e.getMessage());
        }
        return fallbackReply(message);
    }

    private String fallbackReply(String message) {
        String lower = message.toLowerCase();
        if (lower.contains("progression") || lower.contains("avancement"))
            return "Consultez l'onglet **Progression** pour voir vos statistiques détaillées.";
        if (lower.contains("quiz") || lower.contains("évaluation"))
            return "Terminez les leçons d'un module avant de passer son évaluation. Score minimum : **70%**.";
        if (lower.contains("certificat"))
            return "Terminez 100% d'un cours et validez tous les quiz pour obtenir votre certificat.";
        return "Je suis **EduBot**, votre assistant pédagogique. Posez-moi vos questions sur vos cours, votre progression ou vos évaluations.";
    }
}
