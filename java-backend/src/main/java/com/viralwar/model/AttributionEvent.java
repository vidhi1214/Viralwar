package com.viralwar.model;

import com.viralwar.model.enums.AttributionStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attribution_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttributionEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id")
    private Campaign campaign;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private CreatorProfile creator;

    @Column(length = 255)
    private String submissionId;

    @Column(length = 255)
    private String clickId;

    @Column(length = 255)
    private String conversionId;

    @Column(name = "click")
    private Boolean click;

    @Column(name = "conversion")
    private Boolean conversion;

    @Column(length = 255)
    private String orderRef;

    @Column
    private Float revenue;

    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AttributionStatus status = AttributionStatus.PENDING;

    @Column(length = 255, unique = true)
    private String idempotencyKey;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}