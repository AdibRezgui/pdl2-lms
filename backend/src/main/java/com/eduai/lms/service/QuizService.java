package com.eduai.lms.service;

import com.eduai.lms.dto.request.QuizAttemptRequest;
import com.eduai.lms.exception.ResourceNotFoundException;
import com.eduai.lms.model.*;
import com.eduai.lms.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final CourseRepository courseRepository;
    private final ObjectMapper objectMapper;

    public List<Quiz> getQuizzesByCourse(UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Cours non trouvé"));
        return quizRepository.findByCourse(course);
    }

    public Quiz getQuizById(UUID quizId) {
        return quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz non trouvé"));
    }

    public QuizAttempt submitAttempt(QuizAttemptRequest request, User student) {
        Quiz quiz = quizRepository.findById(request.getQuizId())
                .orElseThrow(() -> new ResourceNotFoundException("Quiz non trouvé"));

        long attemptCount = quizAttemptRepository.countByUserAndQuiz(student, quiz);
        if (attemptCount >= quiz.getMaxAttempts()) {
            throw new IllegalStateException("Nombre maximum de tentatives atteint");
        }

        int score = calculateScore(quiz, request.getAnswers());
        boolean passed = score >= quiz.getPassingScore();

        String answersJson;
        try {
            answersJson = objectMapper.writeValueAsString(request.getAnswers());
        } catch (JsonProcessingException e) {
            answersJson = "{}";
        }

        QuizAttempt attempt = QuizAttempt.builder()
                .quiz(quiz)
                .user(student)
                .score(score)
                .passed(passed)
                .answers(answersJson)
                .timeTakenSeconds(request.getTimeTakenSeconds())
                .completedAt(LocalDateTime.now())
                .build();

        return quizAttemptRepository.save(attempt);
    }

    public List<QuizAttempt> getMyAttempts(User student) {
        return quizAttemptRepository.findByUser(student);
    }

    public Quiz createQuiz(UUID courseId, String title, int timeLimit, int passingScore,
                           List<Map<String, Object>> questionsData, User trainer) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Cours non trouvé"));

        if (!course.getTrainer().getId().equals(trainer.getId())) {
            throw new IllegalStateException("Accès refusé");
        }

        Quiz quiz = Quiz.builder()
                .course(course)
                .title(title)
                .timeLimit(timeLimit)
                .passingScore(passingScore)
                .build();

        if (questionsData != null) {
            int order = 0;
            for (Map<String, Object> qData : questionsData) {
                @SuppressWarnings("unchecked")
                List<String> opts = (List<String>) qData.get("options");
                Question q = Question.builder()
                        .quiz(quiz)
                        .text((String) qData.get("text"))
                        .options(opts != null ? opts : List.of())
                        .correctAnswer(qData.get("correct") instanceof Integer ? (Integer) qData.get("correct") : 0)
                        .explanation(qData.getOrDefault("explanation", "").toString())
                        .points(10)
                        .sortOrder(order++)
                        .build();
                quiz.getQuestions().add(q);
            }
        }

        return quizRepository.save(quiz);
    }

    private int calculateScore(Quiz quiz, Map<String, Integer> answers) {
        if (answers == null || answers.isEmpty()) return 0;

        int totalPoints = quiz.getQuestions().stream().mapToInt(Question::getPoints).sum();
        if (totalPoints == 0) return 0;

        int earned = quiz.getQuestions().stream()
                .filter(q -> {
                    Integer selected = answers.get(q.getId().toString());
                    return selected != null && selected == q.getCorrectAnswer();
                })
                .mapToInt(Question::getPoints)
                .sum();

        return (int) Math.round((double) earned / totalPoints * 100);
    }
}
