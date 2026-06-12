package com.eduai.lms.repository;

import com.eduai.lms.model.Quiz;
import com.eduai.lms.model.QuizAttempt;
import com.eduai.lms.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, UUID> {
    List<QuizAttempt> findByUser(User user);
    List<QuizAttempt> findByUserAndQuiz(User user, Quiz quiz);
    long countByUserAndQuiz(User user, Quiz quiz);
    long countByQuiz(Quiz quiz);
    List<QuizAttempt> findByQuiz(Quiz quiz);
}
