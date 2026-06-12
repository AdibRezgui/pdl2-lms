package com.eduai.lms.controller;

import com.eduai.lms.dto.response.ApiResponse;
import com.eduai.lms.model.*;
import com.eduai.lms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/trainer")
@PreAuthorize("hasAnyRole('TRAINER','ADMIN')")
@RequiredArgsConstructor
public class TrainerController {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final LessonCompletionRepository lessonCompletionRepository;

    /** All students enrolled in the trainer's courses, with per-course and per-module detail */
    @GetMapping("/students")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> myStudents(
            @AuthenticationPrincipal User trainer) {

        List<Course> courses = courseRepository.findByTrainer(trainer);
        Map<UUID, Map<String, Object>> studentMap = new LinkedHashMap<>();

        for (Course course : courses) {
            List<Enrollment> enrollments = new ArrayList<>();
            enrollmentRepository.findByCourse(course, org.springframework.data.domain.Pageable.unpaged())
                    .forEach(enrollments::add);

            // Load modules + their quizzes once per course
            List<CourseModule> modules = moduleRepository.findByCourseOrderBySortOrderAsc(course);
            // Map moduleId → module quiz (null if none)
            Map<UUID, Quiz> moduleQuizMap = new HashMap<>();
            for (CourseModule mod : modules) {
                quizRepository.findByCourse(course).stream()
                        .filter(q -> q.getModule() != null && q.getModule().getId().equals(mod.getId()))
                        .findFirst()
                        .ifPresent(q -> moduleQuizMap.put(mod.getId(), q));
            }
            // Final quiz for the course
            Quiz finalQuiz = quizRepository.findByCourse(course).stream()
                    .filter(q -> q.getModule() == null)
                    .findFirst().orElse(null);

            for (Enrollment e : enrollments) {
                User student = e.getUser();
                studentMap.computeIfAbsent(student.getId(), id -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", student.getId().toString());
                    m.put("name", student.getName());
                    m.put("email", student.getEmail());
                    m.put("enrollments", new ArrayList<Map<String, Object>>());
                    return m;
                });

                // Get all quiz attempts by this student for this course's quizzes
                List<QuizAttempt> allAttempts = quizAttemptRepository.findByUser(student).stream()
                        .filter(a -> a.getQuiz().getCourse().getId().equals(course.getId()))
                        .collect(Collectors.toList());

                // Get completed lesson IDs for this student
                List<LessonCompletion> completions = lessonCompletionRepository.findByUser(student);
                Set<UUID> completedLessonIds = completions.stream()
                        .map(lc -> lc.getLesson().getId())
                        .collect(Collectors.toSet());

                // Build per-module data
                List<Map<String, Object>> modulesData = new ArrayList<>();
                for (CourseModule mod : modules) {
                    List<Lesson> lessons = lessonRepository.findByModuleOrderBySortOrderAsc(mod);
                    long lessonTotal = lessons.size();
                    long lessonDone = lessons.stream()
                            .filter(l -> completedLessonIds.contains(l.getId())).count();

                    // Quiz status for this module
                    Quiz mQuiz = moduleQuizMap.get(mod.getId());
                    Map<String, Object> quizStatus = buildQuizStatus(mQuiz, allAttempts);

                    Map<String, Object> modData = new HashMap<>();
                    modData.put("moduleId", mod.getId().toString());
                    modData.put("moduleTitle", mod.getTitle());
                    modData.put("lessonTotal", lessonTotal);
                    modData.put("lessonDone", lessonDone);
                    modData.put("quiz", quizStatus);
                    // Module is "done" if all lessons completed AND quiz passed (or no quiz)
                    boolean modDone = lessonDone == lessonTotal && lessonTotal > 0
                            && (mQuiz == null || Boolean.TRUE.equals(quizStatus.get("passed")));
                    modData.put("done", modDone);
                    modulesData.add(modData);
                }

                // Final quiz status
                Map<String, Object> finalQuizStatus = buildQuizStatus(finalQuiz, allAttempts);

                Map<String, Object> eData = new HashMap<>();
                eData.put("courseId", course.getId().toString());
                eData.put("courseTitle", course.getTitle());
                eData.put("progress", e.getProgress());
                eData.put("completed", e.isCompleted());
                eData.put("badgeEarned", e.isBadgeEarned());
                eData.put("lastAccessedAt", e.getLastAccessedAt() != null ? e.getLastAccessedAt().toString() : null);
                eData.put("modules", modulesData);
                eData.put("finalQuiz", finalQuizStatus);

                @SuppressWarnings("unchecked")
                List<Map<String, Object>> eList = (List<Map<String, Object>>) studentMap.get(student.getId()).get("enrollments");
                eList.add(eData);
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> s : studentMap.values()) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> enrs = (List<Map<String, Object>>) s.get("enrollments");
            int avg = enrs.isEmpty() ? 0 : (int) enrs.stream()
                    .mapToInt(e -> (int) e.get("progress")).average().orElse(0);
            s.put("avgProgress", avg);
            s.put("coursesCount", enrs.size());
            result.add(s);
        }
        result.sort(Comparator.comparingInt(s -> -((int) s.get("avgProgress"))));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    private Map<String, Object> buildQuizStatus(Quiz quiz, List<QuizAttempt> attempts) {
        Map<String, Object> status = new HashMap<>();
        if (quiz == null) {
            status.put("exists", false);
            return status;
        }
        status.put("exists", true);
        status.put("quizId", quiz.getId().toString());
        status.put("quizTitle", quiz.getTitle());
        List<QuizAttempt> quizAttempts = attempts.stream()
                .filter(a -> a.getQuiz().getId().equals(quiz.getId()))
                .collect(Collectors.toList());
        status.put("attempted", !quizAttempts.isEmpty());
        boolean passed = quizAttempts.stream().anyMatch(a -> a.isPassed() && a.getScore() >= 70);
        status.put("passed", passed);
        int bestScore = quizAttempts.stream().mapToInt(QuizAttempt::getScore).max().orElse(0);
        status.put("bestScore", bestScore);
        status.put("attempts", quizAttempts.size());
        return status;
    }

    /** Analytics summary for trainer's courses */
    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> analytics(
            @AuthenticationPrincipal User trainer) {

        List<Course> courses = courseRepository.findByTrainer(trainer);

        int totalStudents = courses.stream().mapToInt(Course::getStudentsCount).sum();
        double avgRating = courses.stream().mapToDouble(Course::getRating).average().orElse(0.0);
        int totalHours = courses.stream().mapToInt(c -> c.getDurationHours() != null ? c.getDurationHours() : 0).sum();

        List<Map<String, Object>> courseStats = courses.stream().map(c -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId().toString());
            m.put("title", c.getTitle());
            m.put("studentsCount", c.getStudentsCount());
            m.put("rating", c.getRating());
            m.put("published", c.isPublished());
            m.put("durationHours", c.getDurationHours());

            // Average progress for this course
            List<Enrollment> enrs = new ArrayList<>();
            enrollmentRepository.findByCourse(c, org.springframework.data.domain.Pageable.unpaged()).forEach(enrs::add);
            int avgProgress = enrs.isEmpty() ? 0 : (int) enrs.stream().mapToInt(Enrollment::getProgress).average().orElse(0);
            long completedCount = enrs.stream().filter(Enrollment::isCompleted).count();
            m.put("avgProgress", avgProgress);
            m.put("completedCount", completedCount);
            return m;
        }).collect(Collectors.toList());

        // Quiz stats for trainer's courses
        List<Quiz> quizzes = quizRepository.findByCoursesIn(courses);
        long totalQuizAttempts = quizzes.stream()
                .mapToLong(q -> quizAttemptRepository.findByQuiz(q).size())
                .sum();

        Map<String, Object> data = new HashMap<>();
        data.put("totalStudents", totalStudents);
        data.put("avgRating", Math.round(avgRating * 10.0) / 10.0);
        data.put("totalCourses", courses.size());
        data.put("publishedCourses", courses.stream().filter(Course::isPublished).count());
        data.put("totalHours", totalHours);
        data.put("totalQuizAttempts", totalQuizAttempts);
        data.put("courseStats", courseStats);

        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    /** All quizzes for trainer's courses with attempt stats */
    @GetMapping("/quizzes")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> myQuizzes(
            @AuthenticationPrincipal User trainer) {

        List<Course> courses = courseRepository.findByTrainer(trainer);
        List<Quiz> quizzes = quizRepository.findByCoursesIn(courses);

        List<Map<String, Object>> result = quizzes.stream().map(q -> {
            List<QuizAttempt> attempts = quizAttemptRepository.findByQuiz(q);
            int avgScore = attempts.isEmpty() ? 0 : (int) attempts.stream()
                    .mapToInt(QuizAttempt::getScore).average().orElse(0);
            long passedCount = attempts.stream().filter(QuizAttempt::isPassed).count();

            Map<String, Object> m = new HashMap<>();
            m.put("id", q.getId().toString());
            m.put("title", q.getTitle());
            m.put("courseId", q.getCourse() != null ? q.getCourse().getId().toString() : null);
            m.put("courseTitle", q.getCourse() != null ? q.getCourse().getTitle() : "");
            m.put("questionsCount", q.getQuestions().size());
            m.put("timeLimit", q.getTimeLimit());
            m.put("passingScore", q.getPassingScore());
            m.put("attemptsCount", attempts.size());
            m.put("avgScore", avgScore);
            m.put("passedCount", passedCount);
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
