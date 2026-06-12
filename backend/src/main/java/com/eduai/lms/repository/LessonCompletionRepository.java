package com.eduai.lms.repository;

import com.eduai.lms.model.Lesson;
import com.eduai.lms.model.LessonCompletion;
import com.eduai.lms.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface LessonCompletionRepository extends JpaRepository<LessonCompletion, UUID> {
    boolean existsByUserAndLesson(User user, Lesson lesson);
    List<LessonCompletion> findByUser(User user);
    List<LessonCompletion> findByLesson(Lesson lesson);

    @Query("SELECT lc.lesson.id FROM LessonCompletion lc WHERE lc.user = :user AND lc.lesson IN :lessons")
    List<UUID> findCompletedLessonIds(@Param("user") User user, @Param("lessons") List<Lesson> lessons);
}
