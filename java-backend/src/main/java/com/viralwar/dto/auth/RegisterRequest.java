package com.viralwar.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @Email(message = "Valid email required")
        @NotBlank(message = "Email is required")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        String password,

        @NotBlank(message = "Role is required")
        String role,  // CREATOR | BRAND | ADMIN

        String displayName,
        String handle
) {
    public RegisterRequest(String email, String password, String role) {
        this(email, password, role, null, null);
    }
}

