package com.viralwar.controller;

import com.viralwar.dto.auth.AuthResponse;
import com.viralwar.dto.auth.LoginRequest;
import com.viralwar.dto.auth.RefreshTokenRequest;
import com.viralwar.dto.auth.RegisterRequest;
import com.viralwar.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Auth endpoints — all publicly accessible (no JWT required).
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, and token refresh")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register a new user", description = "Creates CREATOR, BRAND, or ADMIN account. Returns JWT tokens.")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticates credentials and returns JWT access + refresh tokens.")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "Exchanges a valid refresh token for a new access token pair.")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user info", description = "Returns info about the currently authenticated user (requires Bearer token).")
    public ResponseEntity<?> me(org.springframework.security.core.Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
        }
        return ResponseEntity.ok(java.util.Map.of(
                "principal", auth.getName(),
                "authorities", auth.getAuthorities().stream()
                        .map(a -> a.getAuthority()).toList()
        ));
    }
}
