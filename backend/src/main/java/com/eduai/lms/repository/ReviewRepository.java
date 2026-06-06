package com.eduai.lms.repository;

import com.eduai.lms.model.Course;
import com.eduai.lms.model.Review;
import com.eduai.lms.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findByCourse(Course course);
    Optional<Review> findByUserAndCourse(User user, Course course);
    boolean existsByUserAndCourse(User user, Course course);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.course = :course")
    Double findAverageRatingByCourse(@Param("course") Course course);
}
