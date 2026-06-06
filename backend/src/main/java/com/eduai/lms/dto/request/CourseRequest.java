package com.eduai.lms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class CourseRequest {
    @NotBlank
    private String title;
    private String description;
    private String thumbnail;
    private String category;
    private String level;
    private Integer durationHours;
    private BigDecimal price = BigDecimal.ZERO;
    private String language = "Français";
    private List<String> tags = new ArrayList<>();
    private boolean published = false;
}
