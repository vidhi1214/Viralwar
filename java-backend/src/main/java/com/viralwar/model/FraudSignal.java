package com.viralwar.model;

import com.viralwar.model.enums.FraudSignalStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "fraud_signals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FraudSignal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private CreatorProfile creator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id")
    private Submission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id")
    private Campaign campaign;

    @Column(nullable = false, length = 100)
    private String signalType;

    @Builder.Default
    private Float severity = 0.5f;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private FraudSignalStatus status = FraudSignalStatus.CLEAR;

    @Column(columnDefinition = "text")
    private String evidence;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}