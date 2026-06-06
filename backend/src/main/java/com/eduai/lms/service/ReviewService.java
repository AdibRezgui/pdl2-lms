package com.eduai.lms.service;

import com.eduai.lms.dto.request.ReviewRequest;
import com.eduai.lms.exception.ResourceNotFoundException;
import com.eduai.lms.model.Course;
import com.eduai.lms.model.Review;
import com.eduai.lms.model.User;
import com.eduai.lms.repository.CourseRepository;
import com.eduai.lms.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final CourseRepository courseRepository;

    public Review addReview(ReviewRequest request, User student) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Cours non trouvé"));

        if (reviewRepository.existsByUserAndCourse(student, course)) {
            throw new IllegalStateException("Vous avez déjà noté ce cours");
        }

        Review review = Review.builder()
                .user(student)
                .course(course)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review saved = reviewRepository.save(review);
        updateCourseRating(course);
        return saved;
    }

    public List<Review> getCourseReviews(UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Cours non trouvé"));
        return reviewRepository.findByCourse(course);
    }

    private void updateCourseRating(Course course) {
        Double avg = reviewRepository.findAverageRatingByCourse(course);
        long count = reviewRepository.findByCourse(course).size();
        course.setRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        course.setRatingsCount((int) count);
        courseRepository.save(course);
    }
}
