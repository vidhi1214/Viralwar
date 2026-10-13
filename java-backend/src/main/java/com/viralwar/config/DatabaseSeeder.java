package com.viralwar.config;

import com.viralwar.model.*;
import com.viralwar.model.enums.*;
import com.viralwar.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Automatically seeds initial test users, brands, campaigns, submissions,
 * metrics snapshots, leaderboard entries, and fraud signals if DB is empty.
 */
@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final UserRepository userRepository;
    private final BrandRepository brandRepository;
    private final CampaignRepository campaignRepository;
    private final CreatorProfileRepository creatorProfileRepository;
    private final SubmissionRepository submissionRepository;
    private final ContentMetricSnapshotRepository snapshotRepository;
    private final LeaderboardEntryRepository leaderboardRepository;
    private final FraudSignalRepository fraudSignalRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already contains users. Skipping initial seed.");
            return;
        }

        log.info("Seeding initial data into PostgreSQL...");

        String hash = passwordEncoder.encode("Password@123");

        // 1. Users
        User admin = userRepository.save(User.builder()
                .email("admin@viralwar.com")
                .passwordHash(hash)
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build());

        User brandUser = userRepository.save(User.builder()
                .email("brand@nike.com")
                .passwordHash(hash)
                .role(UserRole.BRAND)
                .status(UserStatus.ACTIVE)
                .build());

        User creatorUser1 = userRepository.save(User.builder()
                .email("alex@viralwar.com")
                .passwordHash(hash)
                .role(UserRole.CREATOR)
                .status(UserStatus.ACTIVE)
                .build());

        User creatorUser2 = userRepository.save(User.builder()
                .email("sarah@viralwar.com")
                .passwordHash(hash)
                .role(UserRole.CREATOR)
                .status(UserStatus.ACTIVE)
                .build());

        // 2. Creator Profiles
        CreatorProfile alex = creatorProfileRepository.save(CreatorProfile.builder()
                .user(creatorUser1)
                .username("alexviral")
                .displayName("Alex Rivera")
                .bio("Short-form video creator exploring tech, style & gaming.")
                .avatar("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150")
                .followerCount(245000)
                .verifiedStatus(true)
                .reputationScore(94.5f)
                .categories(Set.of("TECH", "GAMING", "FASHION"))
                .build());

        CreatorProfile sarah = creatorProfileRepository.save(CreatorProfile.builder()
                .user(creatorUser2)
                .username("sarahcreates")
                .displayName("Sarah Chen")
                .bio("Visual artist & viral storyteller crafting aesthetic reels.")
                .avatar("https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150")
                .followerCount(480000)
                .verifiedStatus(true)
                .reputationScore(98.2f)
                .categories(Set.of("LIFESTYLE", "FITNESS", "CREATIVE"))
                .build());

        // 3. Brand
        Brand nike = brandRepository.save(Brand.builder()
                .name("Nike Athletics")
                .slug("nike-athletics")
                .description("Global sports footwear & apparel leader empowering athletes everywhere.")
                .logo("https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150")
                .website("https://nike.com")
                .verificationStatus(true)
                .build());

        // 4. Campaigns
        Campaign campaign1 = campaignRepository.save(Campaign.builder()
                .brand(nike)
                .title("Air Max 2026 Viral Challenge")
                .slug("air-max-2026-viral-challenge")
                .description("Create dynamic, high-energy reels & shorts highlighting the new Air Max cushioning.")
                .product("Air Max Pulse 2026")
                .objective("BRAND_AWARENESS")
                .status(CampaignStatus.ACTIVE)
                .budget(150000.0f)
                .prizePool(75000.0f)
                .currency("INR")
                .rules("1. Tag #AirMaxViral and #ViralWar in caption. 2. Must feature visible shoe motion in first 3 seconds.")
                .eligibility("Minimum 5,000 followers across Instagram or YouTube.")
                .platforms(Set.of("YOUTUBE", "INSTAGRAM"))
                .startAt(LocalDateTime.now().minusDays(5))
                .endAt(LocalDateTime.now().plusDays(25))
                .build());

        Campaign campaign2 = campaignRepository.save(Campaign.builder()
                .brand(nike)
                .title("Summer Cyber Drop")
                .slug("summer-cyber-drop")
                .description("Showcase the limited-edition summer glow apparel collection.")
                .product("CyberTech Sportswear")
                .objective("CONVERSIONS")
                .status(CampaignStatus.ACTIVE)
                .budget(90000.0f)
                .prizePool(45000.0f)
                .currency("INR")
                .rules("Show the transition from daytime street to neon nighttime workout.")
                .eligibility("All verified ViralWar creators.")
                .platforms(Set.of("INSTAGRAM", "YOUTUBE"))
                .startAt(LocalDateTime.now().minusDays(2))
                .endAt(LocalDateTime.now().plusDays(18))
                .build());

        // 5. Submissions
        Submission sub1 = submissionRepository.save(Submission.builder()
                .campaign(campaign1)
                .creator(alex)
                .platform("YOUTUBE")
                .contentUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
                .contentType("VIDEO")
                .caption("Air Max 2026 in the wild! Speed test on concrete #AirMaxViral #ViralWar")
                .status("APPROVED")
                .moderationStatus("APPROVED")
                .build());

        Submission sub2 = submissionRepository.save(Submission.builder()
                .campaign(campaign1)
                .creator(sarah)
                .platform("INSTAGRAM")
                .contentUrl("https://www.instagram.com/reel/Cw99XYZ123/")
                .contentType("REEL")
                .caption("Aesthetic sprint in neon glow. Air Max feels like zero gravity ✨ #AirMaxViral")
                .status("APPROVED")
                .moderationStatus("APPROVED")
                .build());

        Submission sub3 = submissionRepository.save(Submission.builder()
                .campaign(campaign2)
                .creator(alex)
                .platform("YOUTUBE")
                .contentUrl("https://www.youtube.com/shorts/3JZ_D3ELwOQ")
                .contentType("SHORTS")
                .caption("Cyber Drop workout test 🔥")
                .status("PENDING")
                .moderationStatus("PENDING")
                .build());

        // 6. Metrics Snapshots
        snapshotRepository.save(ContentMetricSnapshot.builder()
                .submission(sub1)
                .platform("YOUTUBE")
                .views(342500L)
                .likes(28900L)
                .comments(1840L)
                .shares(4200L)
                .reach(342500L)
                .engagementRate(8.97)
                .capturedAt(LocalDateTime.now().minusHours(4))
                .build());

        snapshotRepository.save(ContentMetricSnapshot.builder()
                .submission(sub2)
                .platform("INSTAGRAM")
                .views(512000L)
                .likes(49200L)
                .comments(3120L)
                .shares(8900L)
                .reach(490000L)
                .engagementRate(12.14)
                .capturedAt(LocalDateTime.now().minusHours(2))
                .build());

        // 7. Leaderboard Entries
        leaderboardRepository.save(LeaderboardEntry.builder()
                .campaign(campaign1)
                .creator(sarah)
                .score(942.5f)
                .views(512000)
                .engagement(52320)
                .conversions(38)
                .trend(14.8f)
                .movement("UP")
                .build());

        leaderboardRepository.save(LeaderboardEntry.builder()
                .campaign(campaign1)
                .creator(alex)
                .score(865.0f)
                .views(342500)
                .engagement(30740)
                .conversions(24)
                .trend(8.2f)
                .movement("STABLE")
                .build());

        // 8. Fraud Signals
        fraudSignalRepository.save(FraudSignal.builder()
                .creator(alex)
                .campaign(campaign1)
                .signalType("UNUSUAL_VELOCITY_SPIKE")
                .severity(0.35f)
                .status(FraudSignalStatus.CLEAR)
                .evidence("{\"detected_delta\": \"+45k in 12m\", \"reason\": \"Verified viral algorithm push to YouTube homepage, no bot signatures.\"}")
                .build());

        fraudSignalRepository.save(FraudSignal.builder()
                .creator(sarah)
                .campaign(campaign2)
                .signalType("CLICK_FARM_IP_CLUSTER")
                .severity(0.72f)
                .status(FraudSignalStatus.REVIEW)
                .evidence("{\"suspicious_pct\": 4.2, \"ip_subnets\": [\"185.220.101.0/24\"], \"action\": \"Hold payout validation until human review.\"}")
                .build());

        log.info("Database seeding completed successfully! Users: admin@viralwar.com, brand@nike.com, alex@viralwar.com, sarah@viralwar.com (password: Password@123)");
    }
}
