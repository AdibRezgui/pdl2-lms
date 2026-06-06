package com.eduai.lms.repository;

import com.eduai.lms.model.Course;
import com.eduai.lms.model.CourseModule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ModuleRepository extends JpaRepository<CourseModule, UUID> {
    List<CourseModule> findByCourseOrderBySortOrderAsc(Course course);
}
