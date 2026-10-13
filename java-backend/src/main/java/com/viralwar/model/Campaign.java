package com.viralwar.model;

import com.viralwar.model.enums.CampaignStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "campaigns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(unique = true, nullable = false, length = 255)
    private String slug;

    @Column(length = 2000)
    private String description;

    @Column(length = 255)
    private String product;

    @Column(length = 255)
    private String objective;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CampaignStatus status;

    @Column(name = "start_at")
    private LocalDateTime startAt;

    @Column(name = "end_at")
    private LocalDateTime endAt;

    private Float budget;
    private Float prizePool;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String currency = "INR";

    @Column(columnDefinition = "text")
    private String rules;

    @Column(columnDefinition = "text")
    private String eligibility;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "campaign_platforms", joinColumns = @JoinColumn(name = "campaign_id"))
    @Column(name = "platform")
    @Builder.Default
    private Set<String> platforms = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "campaign", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<CampaignParticipant> campaignParticipants;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "campaign", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Submission> submissions;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "campaign", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<CampaignMetricConfig> metricConfigs;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "campaign", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<AIInsight> aiInsights;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "campaign", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<FraudSignal> fraudSignals;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = CampaignStatus.DRAFT;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}