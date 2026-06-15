package com.eduai.lms.dto.response;

import com.eduai.lms.model.Lesson;
import com.eduai.lms.model.enums.LessonType;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class LessonResponse {
    private UUID id;
    private String title;
    private LessonType type;
    private String content;
    private String videoUrl;
    private String pdfUrl;
    private int durationMinutes;
    private int sortOrder;
    private boolean free;
    private LocalDateTime createdAt;

    public static LessonResponse from(Lesson l) {
        LessonResponse r = new LessonResponse();
        r.id            = l.getId();
        r.title         = l.getTitle();
        r.type          = l.getType();
        r.content       = l.getContent();
        r.videoUrl      = l.getVideoUrl();
        r.pdfUrl        = l.getPdfUrl();
        r.durationMinutes = l.getDurationMinutes();
        r.sortOrder     = l.getSortOrder();
        r.free          = l.isFree();
        r.createdAt     = l.getCreatedAt();
        return r;
    }
}
