package com.eduai.lms.repository;

import com.eduai.lms.model.Course;
import com.eduai.lms.model.Enrollment;
import com.eduai.lms.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {
    List<Enrollment> findByUser(User user);
    Page<Enrollment> findByCourse(Course course, Pageable pageable);
    Optional<Enrollment> findByUserAndCourse(User user, Course course);
    boolean existsByUserAndCourse(User user, Course course);

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.course.trainer = :trainer")
    long countByTrainer(@Param("trainer") User trainer);

    @Query("SELECT COUNT(DISTINCT e.user) FROM Enrollment e")
    long countDistinctStudents();

    long countByCompleted(boolean completed);
}
