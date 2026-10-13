package com.viralwar.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * SpringDoc OpenAPI 3.0 configuration — Swagger UI at /api/swagger-ui.html
 */
@Configuration
public class OpenApiConfig {

    private static final String BEARER_AUTH = "bearerAuth";

    @Bean
    public OpenAPI viralWarOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ViralWar Platform API")
                        .description("""
                                Production-grade REST API for ViralWar — a creator marketing platform.
                                
                                **Features:**
                                - JWT-based authentication (access + refresh tokens)
                                - Campaign management for brands and creators
                                - Real-time social metrics via YouTube & Instagram Graph APIs
                                - Fraud detection signals
                                - Leaderboard & rewards engine
                                """)
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("ViralWar Engineering")
                                .email("engineering@viralwar.io"))
                        .license(new License().name("Proprietary")))
                .servers(List.of(
                        new Server().url("http://localhost:8080/api").description("Local Development"),
                        new Server().url("https://api.viralwar.io").description("Production")
                ))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH))
                .components(new Components()
                        .addSecuritySchemes(BEARER_AUTH, new SecurityScheme()
                                .name(BEARER_AUTH)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Paste the JWT access token obtained from /api/auth/login")));
    }
}
