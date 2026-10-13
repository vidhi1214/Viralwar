package com.viralwar.dto.campaign;

import java.time.LocalDateTime;
import java.util.Set;

public record CampaignResponse(
        Long id,
        Long brandId,
        String brandName,
        String title,
        String slug,
        String description,
        String product,
        String objective,
        String status,
        LocalDateTime startAt,
        LocalDateTime endAt,
        Float budget,
        Float prizePool,
        String currency,
        Set<String> platforms,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
