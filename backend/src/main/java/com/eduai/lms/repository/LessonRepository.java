package com.eduai.lms.repository;

import com.eduai.lms.model.CourseModule;
import com.eduai.lms.model.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LessonRepository extends JpaRepository<Lesson, UUID> {
    List<Lesson> findByModuleOrderBySortOrderAsc(CourseModule module);
    long countByCourseId(UUID courseId);
}
