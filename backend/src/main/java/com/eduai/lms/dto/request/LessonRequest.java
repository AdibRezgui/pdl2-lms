package com.eduai.lms.dto.request;

import com.eduai.lms.model.enums.LessonType;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LessonRequest {
    @NotBlank
    private String title;
    private LessonType type = LessonType.VIDEO;
    private String content;
    private String videoUrl;
    private String pdfUrl;
    private int durationMinutes = 0;
    private int sortOrder = 0;
    private boolean free = false;
}
