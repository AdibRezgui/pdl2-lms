package com.eduai.lms.repository;

import com.eduai.lms.model.Course;
import com.eduai.lms.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface QuizRepository extends JpaRepository<Quiz, UUID> {
    List<Quiz> findByCourse(Course course);

    @Query("SELECT q FROM Quiz q WHERE q.course IN :courses")
    List<Quiz> findByCoursesIn(@Param("courses") List<Course> courses);
}
