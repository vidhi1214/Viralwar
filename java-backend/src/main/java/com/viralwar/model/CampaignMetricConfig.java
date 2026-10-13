package com.viralwar.model;

import com.viralwar.model.enums.CampaignMetricCapType;
import com.viralwar.model.enums.CampaignMetricMetric;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "campaign_metric_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignMetricConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private Campaign campaign;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CampaignMetricMetric metric;

    @Builder.Default
    private Float weight = 1.0f;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CampaignMetricCapType capType = CampaignMetricCapType.NONE;

    private Float capValue;
    private Float minimumThreshold;
    private Float maximumThreshold;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}