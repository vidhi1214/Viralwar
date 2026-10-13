package com.viralwar.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Application-level beans: WebClient for social API calls, caching enablement.
 */
@Configuration
@EnableCaching
public class AppConfig {

    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }

    @Bean("youtubeWebClient")
    public WebClient youtubeWebClient(WebClient.Builder builder) {
        return builder
                .baseUrl("https://www.googleapis.com/youtube/v3")
                .defaultHeader("Accept", "application/json")
                .build();
    }

    @Bean("instagramWebClient")
    public WebClient instagramWebClient(WebClient.Builder builder) {
        return builder
                .baseUrl("https://graph.instagram.com/v20.0")
                .defaultHeader("Accept", "application/json")
                .build();
    }
}
