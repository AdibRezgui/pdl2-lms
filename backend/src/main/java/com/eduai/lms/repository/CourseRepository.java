package com.eduai.lms.repository;

import com.eduai.lms.model.Course;
import com.eduai.lms.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CourseRepository extends JpaRepository<Course, UUID> {

    Page<Course> findByPublishedTrue(Pageable pageable);
    Page<Course> findByTrainer(User trainer, Pageable pageable);
    List<Course> findByTrainer(User trainer);

    @Query("SELECT c FROM Course c WHERE c.published = true AND " +
           "(LOWER(c.title) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(c.category) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Course> searchPublished(@Param("q") String query, Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.published = true AND " +
           "(:category IS NULL OR c.category = :category) AND " +
           "(:level IS NULL OR c.level = :level)")
    Page<Course> findPublishedWithFilters(
        @Param("category") String category,
        @Param("level") String level,
        Pageable pageable);

    long countByPublishedTrue();
}
