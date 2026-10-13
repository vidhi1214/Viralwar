package com.viralwar.dto.submission;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SubmissionCreateRequest(
        @NotNull Long campaignId,
        @NotNull Long creatorId,
        @NotBlank String contentUrl,
        String platform,
        String contentType,
        String caption
) {}
