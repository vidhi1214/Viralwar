package com.viralwar.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "leaderboard_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaderboardEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private Campaign campaign;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private CreatorProfile creator;

    @Column
    private Float score;

    private Integer views = 0;

    private Integer engagement = 0;

    private Integer conversions = 0;

    @Column
    private Float trend = 0.0f;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String movement = "NONE";

    @Column(name = "captured_at", nullable = false, updatable = false)
    private LocalDateTime capturedAt;

    @PrePersist
    protected void onCreate() {
        capturedAt = LocalDateTime.now();
    }
}