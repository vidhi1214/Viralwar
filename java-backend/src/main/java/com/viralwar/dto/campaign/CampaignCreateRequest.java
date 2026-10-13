package com.viralwar.dto.campaign;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;
import java.util.Set;

public record CampaignCreateRequest(
        @NotBlank(message = "Title is required") String title,
        @NotBlank(message = "Slug is required") String slug,
        String description,
        String product,
        String objective,
        LocalDateTime startAt,
        LocalDateTime endAt,
        @Positive Float budget,
        @Positive Float prizePool,
        String currency,
        String rules,
        String eligibility,
        Set<String> platforms
) {}
