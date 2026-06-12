package com.eduai.lms.service;

import com.eduai.lms.dto.request.QuizAttemptRequest;
import com.eduai.lms.exception.ResourceNotFoundException;
import com.eduai.lms.model.*;
import com.eduai.lms.model.enums.UserRole;
import com.eduai.lms.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QuizServiceTest {

    @Mock QuizRepository quizRepository;
    @Mock QuizAttemptRepository quizAttemptRepository;
    @Mock CourseRepository courseRepository;
    @Mock ModuleRepository moduleRepository;

    @InjectMocks QuizService quizService;

    private Quiz quiz;
    private User student;
    private UUID quizId;

    @BeforeEach
    void setUp() {
        quizId = UUID.randomUUID();
        student = User.builder()
                .id(UUID.randomUUID())
                .name("Étudiant")
                .email("student@test.com")
                .role(UserRole.STUDENT)
                .build();

        quiz = Quiz.builder()
                .id(quizId)
                .title("Quiz Java")
                .maxAttempts(3)
                .passingScore(60)
                .build();

        // Set up the ObjectMapper via reflection
        try {
            var field = QuizService.class.getDeclaredField("objectMapper");
            field.setAccessible(true);
            field.set(quizService, new ObjectMapper());
        } catch (Exception ignored) {}
    }

    @Test
    void getQuizById_found_returnsQuiz() {
        when(quizRepository.findById(quizId)).thenReturn(Optional.of(quiz));

        Quiz result = quizService.getQuizById(quizId);

        assertThat(result.getTitle()).isEqualTo("Quiz Java");
    }

    @Test
    void getQuizById_notFound_throwsException() {
        when(quizRepository.findById(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> quizService.getQuizById(UUID.randomUUID()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void submitAttempt_tooManyAttempts_throwsIllegalState() {
        when(quizRepository.findById(quizId)).thenReturn(Optional.of(quiz));
        when(quizAttemptRepository.countByUserAndQuiz(student, quiz)).thenReturn(3L);

        QuizAttemptRequest req = new QuizAttemptRequest();
        req.setQuizId(quizId);
        req.setAnswers(Map.of());

        assertThatThrownBy(() -> quizService.submitAttempt(req, student))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("tentatives");
    }

    @Test
    void submitAttempt_withinLimit_savesAttempt() {
        quiz.setQuestions(List.of());
        when(quizRepository.findById(quizId)).thenReturn(Optional.of(quiz));
        when(quizAttemptRepository.countByUserAndQuiz(student, quiz)).thenReturn(0L);
        when(quizAttemptRepository.save(any(QuizAttempt.class))).thenAnswer(inv -> inv.getArgument(0));

        QuizAttemptRequest req = new QuizAttemptRequest();
        req.setQuizId(quizId);
        req.setAnswers(Map.of());

        QuizAttempt result = quizService.submitAttempt(req, student);

        assertThat(result).isNotNull();
        verify(quizAttemptRepository).save(any(QuizAttempt.class));
    }

    @Test
    void getQuizzesByCourse_returnsListForCourse() {
        Course course = Course.builder().id(UUID.randomUUID()).build();
        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));
        when(quizRepository.findByCourse(course)).thenReturn(List.of(quiz));

        List<Quiz> quizzes = quizService.getQuizzesByCourse(course.getId());

        assertThat(quizzes).hasSize(1);
        assertThat(quizzes.get(0).getTitle()).isEqualTo("Quiz Java");
    }
}
