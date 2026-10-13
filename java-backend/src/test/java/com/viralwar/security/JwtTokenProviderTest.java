package com.viralwar.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "secret", "my-super-secret-key-that-is-at-least-32-chars-long-for-testing");
        ReflectionTestUtils.setField(jwtTokenProvider, "expirationMs", 3600000L); // 1 hour
        ReflectionTestUtils.setField(jwtTokenProvider, "refreshExpirationMs", 7200000L); // 2 hours

        userDetails = new User(
                "creator@viralwar.com",
                "password123",
                List.of(new SimpleGrantedAuthority("ROLE_CREATOR"))
        );
    }

    @Test
    @DisplayName("Generate access token and extract subject")
    void testGenerateAccessTokenAndExtractUsername() {
        String token = jwtTokenProvider.generateAccessToken(userDetails);

        assertNotNull(token);
        assertFalse(token.isBlank());

        String username = jwtTokenProvider.extractUsername(token);
        assertEquals("creator@viralwar.com", username);
    }

    @Test
    @DisplayName("Validate token successfully with matching user details")
    void testValidateTokenSuccess() {
        String token = jwtTokenProvider.generateAccessToken(userDetails);

        assertTrue(jwtTokenProvider.isTokenValid(token, userDetails));
        assertTrue(jwtTokenProvider.validateToken(token));
        assertFalse(jwtTokenProvider.isTokenExpired(token));
    }

    @Test
    @DisplayName("Token validation fails for non-matching user")
    void testValidateTokenWithDifferentUser() {
        String token = jwtTokenProvider.generateAccessToken(userDetails);

        UserDetails otherUser = new User("other@viralwar.com", "password", Collections.emptyList());
        assertFalse(jwtTokenProvider.isTokenValid(token, otherUser));
    }

    @Test
    @DisplayName("Generate and validate refresh token")
    void testRefreshToken() {
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        assertNotNull(refreshToken);
        assertTrue(jwtTokenProvider.validateToken(refreshToken));
        assertEquals("creator@viralwar.com", jwtTokenProvider.extractUsername(refreshToken));
    }

    @Test
    @DisplayName("Invalid token fails validation")
    void testInvalidToken() {
        assertFalse(jwtTokenProvider.validateToken("invalid.token.string"));
    }
}
