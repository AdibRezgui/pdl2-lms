package com.eduai.lms.service;

import com.eduai.lms.dto.request.ModuleRequest;
import com.eduai.lms.exception.ResourceNotFoundException;
import com.eduai.lms.model.Course;
import com.eduai.lms.model.CourseModule;
import com.eduai.lms.model.User;
import com.eduai.lms.model.enums.UserRole;
import com.eduai.lms.repository.CourseRepository;
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
public class ModuleService {

    private final ModuleRepository moduleRepository;
    private final CourseRepository courseRepository;

    public List<CourseModule> getModulesByCourse(UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Cours non trouvé"));
        return moduleRepository.findByCourseOrderBySortOrderAsc(course);
    }

    public CourseModule createModule(UUID courseId, ModuleRequest request, User currentUser) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Cours non trouvé"));
        checkAccess(course, currentUser);

        CourseModule module = CourseModule.builder()
                .course(course)
                .title(request.getTitle())
                .description(request.getDescription())
                .sortOrder(request.getSortOrder())
                .build();

        return moduleRepository.save(module);
    }

    public CourseModule updateModule(UUID moduleId, ModuleRequest request, User currentUser) {
        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module non trouvé"));
        checkAccess(module.getCourse(), currentUser);

        module.setTitle(request.getTitle());
        module.setDescription(request.getDescription());
        module.setSortOrder(request.getSortOrder());

        return moduleRepository.save(module);
    }

    public void deleteModule(UUID moduleId, User currentUser) {
        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module non trouvé"));
        checkAccess(module.getCourse(), currentUser);
        moduleRepository.delete(module);
    }

    public CourseModule toggleLock(UUID moduleId, User currentUser) {
        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module non trouvé"));
        checkAccess(module.getCourse(), currentUser);
        module.setLocked(!module.isLocked());
        return moduleRepository.save(module);
    }

    private void checkAccess(Course course, User user) {
        if (!user.getRole().equals(UserRole.ADMIN) &&
            !course.getTrainer().getId().equals(user.getId())) {
            throw new AccessDeniedException("Accès refusé");
        }
    }
}
