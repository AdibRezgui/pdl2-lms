package com.eduai.lms.dto.response;

import com.eduai.lms.model.SecurityEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityEventResponse {

    private UUID id;
    private String type;
    private String severity;
    private String sourceIp;
    private String requestPath;
    private String httpMethod;
    private String payload;
    private String userAgent;
    private LocalDateTime createdAt;

    public static SecurityEventResponse from(SecurityEvent e) {
        return SecurityEventResponse.builder()
                .id(e.getId())
                .type(e.getType().name())
                .severity(e.getSeverity().name())
                .sourceIp(e.getSourceIp())
                .requestPath(e.getRequestPath())
                .httpMethod(e.getHttpMethod())
                .payload(e.getPayload())
                .userAgent(e.getUserAgent())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
