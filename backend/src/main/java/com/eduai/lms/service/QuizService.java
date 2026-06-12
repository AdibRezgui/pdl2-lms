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
import java.util.ArrayList;
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
    private final com.eduai.lms.repository.ModuleRepository moduleRepository;
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
        return createQuiz(courseId, null, title, timeLimit, passingScore, questionsData, trainer);
    }

    public Quiz createQuiz(UUID courseId, UUID moduleId, String title, int timeLimit, int passingScore,
                           List<Map<String, Object>> questionsData, User trainer) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Cours non trouvé"));

        if (!course.getTrainer().getId().equals(trainer.getId())) {
            throw new IllegalStateException("Accès refusé");
        }

        CourseModule module = null;
        if (moduleId != null) {
            module = moduleRepository.findById(moduleId).orElse(null);
            // Replace existing quiz for this module
            if (module != null) quizRepository.deleteByModule(module);
        } else {
            // Replace existing course-level quiz (overwrite behavior)
            List<Quiz> existing = quizRepository.findByModuleIsNullAndCourse(course);
            for (Quiz old : existing) {
                quizAttemptRepository.findByQuiz(old).forEach(quizAttemptRepository::delete);
                quizRepository.delete(old);
            }
            quizRepository.flush();
        }

        Quiz quiz = Quiz.builder()
                .course(course)
                .module(module)
                .title(title)
                .timeLimit(timeLimit)
                .passingScore(passingScore)
                .build();

        if (questionsData != null) {
            int order = 0;
            for (Map<String, Object> qData : questionsData) {
                @SuppressWarnings("unchecked")
                List<String> opts = (List<String>) qData.get("options");

                int correct = 0;
                Object rawCorrect = qData.get("correct");
                if (rawCorrect instanceof Integer) correct = (Integer) rawCorrect;
                else if (rawCorrect instanceof Number) correct = ((Number) rawCorrect).intValue();

                // Multi-correct answers list
                List<Integer> correctAnswers = new ArrayList<>();
                Object rawMulti = qData.get("correctAnswers");
                if (rawMulti instanceof List) {
                    for (Object v : (List<?>) rawMulti) {
                        if (v instanceof Integer) correctAnswers.add((Integer) v);
                        else if (v instanceof Number) correctAnswers.add(((Number) v).intValue());
                    }
                }

                Question q = Question.builder()
                        .quiz(quiz)
                        .text((String) qData.get("text"))
                        .options(opts != null ? opts : List.of())
                        .correctAnswer(correct)
                        .correctAnswers(correctAnswers)
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
                    if (selected == null) return false;
                    List<Integer> multi = q.getCorrectAnswers();
                    if (multi != null && !multi.isEmpty()) {
                        // Multi-correct: student sends bitmask (1 << i for each selected i)
                        int expectedBitmask = multi.stream().mapToInt(i -> 1 << i).sum();
                        return selected == expectedBitmask;
                    }
                    return selected == q.getCorrectAnswer();
                })
                .mapToInt(Question::getPoints)
                .sum();

        return (int) Math.round((double) earned / totalPoints * 100);
    }
}
