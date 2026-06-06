package com.eduai.lms.dto.request;

import com.eduai.lms.model.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String name;

    @Email @NotBlank
    private String email;

    @NotBlank @Size(min = 8)
    private String password;

    private UserRole role = UserRole.STUDENT;
    private String avatar;
    private String bio;
}
