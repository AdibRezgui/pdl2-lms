package com.eduai.lms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;
import java.util.UUID;

@Data
public class QuizAttemptRequest {
    @NotNull
    private UUID quizId;

    private Map<String, Integer> answers;  // questionId → selectedOptionIndex
    private Integer timeTakenSeconds;
}
