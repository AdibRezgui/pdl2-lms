package com.eduai.lms.dto.response;

import com.eduai.lms.model.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    @Builder.Default
    private String tokenType = "Bearer";
    private String refreshToken;
    private UUID userId;
    private String name;
    private String email;
    private UserRole role;
    private String avatar;
}
