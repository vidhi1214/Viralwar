package com.viralwar.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "creator_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CreatorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(unique = true, nullable = false, length = 255)
    private String username;

    @Column(length = 255)
    private String displayName;

    @Column(length = 500)
    private String bio;

    @Column(length = 255)
    private String avatar;

    @Column(length = 255)
    private String coverImage;

    @Column(length = 50)
    private String location;

    @Builder.Default
    private Integer followerCount = 0;

    @Builder.Default
    private Boolean verifiedStatus = false;

    @Builder.Default
    private Float reputationScore = 0.0f;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "creator_categories", joinColumns = @JoinColumn(name = "creator_id"))
    @Column(name = "category")
    @Builder.Default
    private Set<String> categories = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "creator_languages", joinColumns = @JoinColumn(name = "creator_id"))
    @Column(name = "language")
    @Builder.Default
    private Set<String> languages = new HashSet<>();

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Submission> submissions;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<CampaignParticipant> campaignParticipants;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<LeaderboardEntry> leaderboardEntries;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Reward> rewards;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<FraudSignal> fraudSignals;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<SocialAccount> socialAccounts;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<AttributionEvent> attributionEvents;
}