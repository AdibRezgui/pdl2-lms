package com.eduai.lms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ModuleRequest {
    @NotBlank
    private String title;
    private String description;
    private int sortOrder = 0;
}
