package com.eduai.lms.service;

import com.eduai.lms.dto.request.LessonRequest;
import com.eduai.lms.exception.ResourceNotFoundException;
import com.eduai.lms.model.CourseModule;
import com.eduai.lms.model.Lesson;
import com.eduai.lms.model.User;
import com.eduai.lms.model.enums.UserRole;
import com.eduai.lms.repository.LessonRepository;
import com.eduai.lms.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class LessonService {

    private final LessonRepository lessonRepository;
    private final ModuleRepository moduleRepository;

    public List<Lesson> getLessonsByModule(UUID moduleId) {
        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module non trouvé"));
        return lessonRepository.findByModuleOrderBySortOrderAsc(module);
    }

    public Lesson createLesson(UUID moduleId, LessonRequest request, User currentUser) {
        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module non trouvé"));
        checkAccess(module, currentUser);

        Lesson lesson = Lesson.builder()
                .module(module)
                .course(module.getCourse())
                .title(request.getTitle())
                .type(request.getType())
                .content(request.getContent())
                .videoUrl(request.getVideoUrl())
                .pdfUrl(request.getPdfUrl())
                .durationMinutes(request.getDurationMinutes())
                .sortOrder(request.getSortOrder())
                .free(request.isFree())
                .build();

        return lessonRepository.save(lesson);
    }

    public Lesson updateLesson(UUID lessonId, LessonRequest request, User currentUser) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Leçon non trouvée"));
        checkAccess(lesson.getModule(), currentUser);

        lesson.setTitle(request.getTitle());
        lesson.setType(request.getType());
        lesson.setContent(request.getContent());
        lesson.setVideoUrl(request.getVideoUrl());
        lesson.setPdfUrl(request.getPdfUrl());
        lesson.setDurationMinutes(request.getDurationMinutes());
        lesson.setSortOrder(request.getSortOrder());
        lesson.setFree(request.isFree());

        return lessonRepository.save(lesson);
    }

    public void deleteLesson(UUID lessonId, User currentUser) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Leçon non trouvée"));
        checkAccess(lesson.getModule(), currentUser);
        lessonRepository.delete(lesson);
    }

    private void checkAccess(CourseModule module, User user) {
        if (!user.getRole().equals(UserRole.ADMIN) &&
            !module.getCourse().getTrainer().getId().equals(user.getId())) {
            throw new AccessDeniedException("Accès refusé");
        }
    }
}
