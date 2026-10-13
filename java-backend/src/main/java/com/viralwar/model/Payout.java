package com.viralwar.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payouts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reward_id", nullable = false)
    private Reward reward;

    @Column(nullable = false, length = 100)
    private String provider;

    @Column(length = 255)
    private String providerReference;

    @Column(nullable = false)
    private String status = "PENDING";

    @Column
    private Float amount;

    @Column(nullable = false, length = 10)
    private String currency = "INR";

    @Column(length = 500)
    private String failureReason;

    @Column(name = "failure_at")
    private LocalDateTime failureAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @PrePersist
    protected void onCreate() {
    }
}