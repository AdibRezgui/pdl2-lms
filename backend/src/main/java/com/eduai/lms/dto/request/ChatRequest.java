package com.eduai.lms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
public class ChatRequest {
    @NotBlank
    private String message;

    private List<Map<String, String>> history = new ArrayList<>();
}
