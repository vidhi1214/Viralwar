package com.viralwar.dto.metrics;

import java.time.LocalDateTime;

public record MetricSnapshotResponse(
        Long id,
        Long submissionId,
        String platform,
        Long views,
        Long likes,
        Long comments,
        Long shares,
        Long reach,
        Double engagementRate,
        LocalDateTime capturedAt
) {}
