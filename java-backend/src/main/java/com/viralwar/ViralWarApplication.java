package com.viralwar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

/**
 * ViralWar Backend — Spring Boot 3.2 modular monolith.
 *
 * Features:
 *  - JWT authentication (access + refresh tokens)
 *  - Campaign management (BRAND/CREATOR/ADMIN roles)
 *  - Live social metrics via YouTube Data API v3 + Instagram Graph API v20.0
 *  - Fraud detection signals
 *  - Leaderboard engine
 *  - Caffeine-backed caching for API responses
 *  - OpenAPI 3 / Swagger UI at /api/swagger-ui.html
 */
@SpringBootApplication
@EnableCaching
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class ViralWarApplication {

    public static void main(String[] args) {
        SpringApplication.run(ViralWarApplication.class, args);
    }
}