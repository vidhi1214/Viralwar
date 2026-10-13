package com.viralwar.dto.auth;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        UserInfo user
) {
    public record UserInfo(
            Long id,
            String email,
            String role,
            String status,
            Long creatorId,
            Long brandId,
            String displayName
    ) {}

    public static AuthResponse of(String access, String refresh, long expiresIn,
                                   Long id, String email, String role, String status) {
        return new AuthResponse(
                access, refresh, "Bearer", expiresIn,
                new UserInfo(id, email, role, status, null, null, null)
        );
    }

    public static AuthResponse of(String access, String refresh, long expiresIn,
                                   Long id, String email, String role, String status,
                                   Long creatorId, Long brandId, String displayName) {
        return new AuthResponse(
                access, refresh, "Bearer", expiresIn,
                new UserInfo(id, email, role, status, creatorId, brandId, displayName)
        );
    }
}

