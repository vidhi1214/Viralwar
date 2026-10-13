package com.viralwar.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "social_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private CreatorProfile creator;

    @Column(nullable = false, length = 50)
    private String platform;

    @Column(length = 255)
    private String externalAccountId;

    @Column(length = 255)
    private String accessToken;

    @Column(length = 255)
    private String refreshToken;

    @Column(name = "token_expiry")
    private LocalDateTime tokenExpiry;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "social_scopes", joinColumns = @JoinColumn(name = "social_account_id"))
    @Column(name = "scope")
    private Set<String> scopes = Set.of();

    @Column(name = "connected_at", nullable = false, updatable = false)
    private LocalDateTime connectedAt;

    @PrePersist
    protected void onCreate() {
        connectedAt = LocalDateTime.now();
    }
}