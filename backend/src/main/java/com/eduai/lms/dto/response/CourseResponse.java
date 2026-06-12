package com.eduai.lms.dto.response;

import com.eduai.lms.model.Course;
import com.eduai.lms.model.enums.CourseStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class CourseResponse {
    private UUID id;
    private String title;
    private String description;
    private String thumbnail;
    private String category;
    private String level;
    private Integer durationHours;
    private int studentsCount;
    private double rating;
    private int ratingsCount;
    private BigDecimal price;
    private String language;
    private List<String> tags;
    private UUID trainerId;
    private String trainerName;
    private String trainerAvatar;
    private boolean published;
    private CourseStatus status;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CourseResponse from(Course c) {
        CourseResponse r = new CourseResponse();
        r.setId(c.getId());
        r.setTitle(c.getTitle());
        r.setDescription(c.getDescription());
        r.setThumbnail(c.getThumbnail());
        r.setCategory(c.getCategory());
        r.setLevel(c.getLevel());
        r.setDurationHours(c.getDurationHours());
        r.setStudentsCount(c.getStudentsCount());
        r.setRating(c.getRating());
        r.setRatingsCount(c.getRatingsCount());
        r.setPrice(c.getPrice());
        r.setLanguage(c.getLanguage());
        r.setTags(c.getTags());
        r.setPublished(c.isPublished());
        r.setStatus(c.getStatus());
        r.setRejectionReason(c.getRejectionReason());
        r.setCreatedAt(c.getCreatedAt());
        r.setUpdatedAt(c.getUpdatedAt());
        if (c.getTrainer() != null) {
            r.setTrainerId(c.getTrainer().getId());
            r.setTrainerName(c.getTrainer().getName());
            r.setTrainerAvatar(c.getTrainer().getAvatar());
        }
        return r;
    }
}
