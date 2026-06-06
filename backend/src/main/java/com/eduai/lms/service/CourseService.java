package com.eduai.lms.service;

import com.eduai.lms.dto.request.CourseRequest;
import com.eduai.lms.dto.response.CourseResponse;
import com.eduai.lms.dto.response.PageResponse;
import com.eduai.lms.exception.ResourceNotFoundException;
import com.eduai.lms.model.Course;
import com.eduai.lms.model.User;
import com.eduai.lms.model.enums.UserRole;
import com.eduai.lms.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseService {

    private final CourseRepository courseRepository;

    public PageResponse<CourseResponse> getPublishedCourses(int page, int size, String search, String category, String level) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Course> courses;

        if (search != null && !search.isBlank()) {
            courses = courseRepository.searchPublished(search, pageable);
        } else {
            courses = courseRepository.findPublishedWithFilters(
                (category != null && !category.isBlank()) ? category : null,
                (level != null && !level.isBlank()) ? level : null,
                pageable
            );
        }

        return PageResponse.from(courses.map(CourseResponse::from));
    }

    public CourseResponse getCourseById(UUID id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cours non trouvé: " + id));
        return CourseResponse.from(course);
    }

    public Course getCourseEntityById(UUID id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cours non trouvé: " + id));
    }

    public CourseResponse createCourse(CourseRequest request, User trainer) {
        Course course = Course.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .thumbnail(request.getThumbnail())
                .category(request.getCategory())
                .level(request.getLevel())
                .durationHours(request.getDurationHours())
                .price(request.getPrice())
                .language(request.getLanguage())
                .tags(request.getTags())
                .trainer(trainer)
                .published(request.isPublished())
                .build();

        return CourseResponse.from(courseRepository.save(course));
    }

    public CourseResponse updateCourse(UUID id, CourseRequest request, User currentUser) {
        Course course = getCourseEntityById(id);

        if (!currentUser.getRole().equals(UserRole.ADMIN) &&
            !course.getTrainer().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Vous n'êtes pas autorisé à modifier ce cours");
        }

        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setThumbnail(request.getThumbnail());
        course.setCategory(request.getCategory());
        course.setLevel(request.getLevel());
        course.setDurationHours(request.getDurationHours());
        course.setPrice(request.getPrice());
        course.setLanguage(request.getLanguage());
        course.setTags(request.getTags());
        course.setPublished(request.isPublished());

        return CourseResponse.from(courseRepository.save(course));
    }

    public void deleteCourse(UUID id, User currentUser) {
        Course course = getCourseEntityById(id);

        if (!currentUser.getRole().equals(UserRole.ADMIN) &&
            !course.getTrainer().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Vous n'êtes pas autorisé à supprimer ce cours");
        }

        courseRepository.delete(course);
    }

    public List<CourseResponse> getTrainerCourses(User trainer) {
        return courseRepository.findByTrainer(trainer).stream()
                .map(CourseResponse::from).toList();
    }
}
