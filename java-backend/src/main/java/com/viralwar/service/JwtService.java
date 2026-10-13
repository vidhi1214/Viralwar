package com.viralwar.service;

import com.viralwar.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Date;

/**
 * @deprecated Use {@link JwtTokenProvider} directly.
 * Kept as a thin facade for backwards compatibility.
 */
@Service
@RequiredArgsConstructor
@Deprecated(forRemoval = true)
public class JwtService {

    private final JwtTokenProvider jwtTokenProvider;

    public String generateToken(UserDetails userDetails) {
        return jwtTokenProvider.generateAccessToken(userDetails);
    }

    public String extractUsername(String token) {
        return jwtTokenProvider.extractUsername(token);
    }

    public Date extractExpiration(String token) {
        return jwtTokenProvider.extractExpiration(token);
    }

    public boolean validateToken(String token, String username) {
        return jwtTokenProvider.validateToken(token);
    }

    public boolean isTokenExpired(String token) {
        return jwtTokenProvider.isTokenExpired(token);
    }
}