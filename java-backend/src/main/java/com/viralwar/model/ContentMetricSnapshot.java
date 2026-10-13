package com.viralwar.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "content_metric_snapshots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentMetricSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;

    @Column(length = 50)
    private String platform;

    @Column(name = "captured_at", nullable = false, updatable = false)
    private LocalDateTime capturedAt;

    @Builder.Default
    private Long views = 0L;

    @Builder.Default
    private Long likes = 0L;

    @Builder.Default
    private Long comments = 0L;

    @Builder.Default
    private Long shares = 0L;

    @Builder.Default
    private Long reach = 0L;

    @Builder.Default
    private Double engagementRate = 0.0;

    @Builder.Default
    private Float watchTime = 0.0f;

    @Builder.Default
    private Long clicks = 0L;

    @Builder.Default
    private Long conversions = 0L;

    @Builder.Default
    private Float revenue = 0.0f;

    @PrePersist
    protected void onCreate() {
        if (capturedAt == null) capturedAt = LocalDateTime.now();
    }
}