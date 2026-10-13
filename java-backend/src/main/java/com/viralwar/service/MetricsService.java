package com.viralwar.service;

import com.viralwar.dto.metrics.MetricSnapshotResponse;
import com.viralwar.exception.ResourceNotFoundException;
import com.viralwar.model.ContentMetricSnapshot;
import com.viralwar.model.Submission;
import com.viralwar.model.SocialAccount;
import com.viralwar.model.LeaderboardEntry;
import com.viralwar.model.FraudSignal;
import com.viralwar.repository.ContentMetricSnapshotRepository;
import com.viralwar.repository.SubmissionRepository;
import com.viralwar.repository.SocialAccountRepository;
import com.viralwar.repository.LeaderboardEntryRepository;
import com.viralwar.repository.FraudSignalRepository;
import com.viralwar.service.social.InstagramApiService;
import com.viralwar.service.social.YouTubeApiService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Orchestrates live social API calls to pull real metrics for a submission's content URL.
 * Snapshots are saved to the database for historical tracking.
 */
@Service
@RequiredArgsConstructor
public class MetricsService {

    private static final Logger log = LoggerFactory.getLogger(MetricsService.class);

    private final YouTubeApiService youTubeApiService;
    private final InstagramApiService instagramApiService;
    private final SubmissionRepository submissionRepository;
    private final ContentMetricSnapshotRepository snapshotRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final com.viralwar.repository.LeaderboardEntryRepository leaderboardRepository;
    private final com.viralwar.repository.FraudSignalRepository fraudSignalRepository;

    /**
     * Pulls live metrics from YouTube or Instagram for a submission and persists a snapshot.
     */
    @Transactional
    public MetricSnapshotResponse refreshMetrics(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", submissionId));

        String contentUrl = submission.getContentUrl();
        if (contentUrl == null || contentUrl.isBlank()) {
            throw new IllegalArgumentException("Submission has no content URL");
        }

        ContentMetricSnapshot snapshot;

        // ─── YouTube ─────────────────────────────────────────────────────────
        Optional<String> youtubeVideoId = youTubeApiService.extractVideoId(contentUrl);
        if (youtubeVideoId.isPresent()) {
            snapshot = pullYouTubeMetrics(submission, youtubeVideoId.get());
        }
        // ─── Instagram ────────────────────────────────────────────────────────
        else if (isInstagramUrl(contentUrl)) {
            snapshot = pullInstagramMetrics(submission, contentUrl);
        } else {
            throw new IllegalArgumentException("Unsupported content URL. Must be YouTube or Instagram.");
        }

        ContentMetricSnapshot saved = snapshotRepository.save(snapshot);

        // Update real-time leaderboard entry
        if (submission.getCampaign() != null && submission.getCreator() != null && leaderboardRepository != null) {
            updateLeaderboardForSubmission(submission, saved);
        }

        // Evaluate automated fraud heuristics
        if (fraudSignalRepository != null) {
            evaluateFraudHeuristics(submission, saved);
        }

        return toResponse(saved);
    }

    /**
     * Returns paginated list of metric snapshots for a submission.
     */
    @Transactional(readOnly = true)
    public Page<MetricSnapshotResponse> getSnapshots(Long submissionId, Pageable pageable) {
        if (!submissionRepository.existsById(submissionId)) {
            throw new ResourceNotFoundException("Submission", submissionId);
        }
        return snapshotRepository.findBySubmissionId(submissionId, pageable)
                .map(this::toResponse);
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────

    private ContentMetricSnapshot pullYouTubeMetrics(Submission submission, String videoId) {
        YouTubeApiService.VideoStats stats = youTubeApiService.fetchVideoStats(videoId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "YouTube video not found or stats unavailable for id: " + videoId));

        return ContentMetricSnapshot.builder()
                .submission(submission)
                .platform("YOUTUBE")
                .views(stats.viewCount())
                .likes(stats.likeCount())
                .comments(stats.commentCount())
                .shares(0L)
                .reach(stats.viewCount())
                .engagementRate(stats.engagementRate())
                .capturedAt(LocalDateTime.now())
                .build();
    }

    private ContentMetricSnapshot pullInstagramMetrics(Submission submission, String contentUrl) {
        // Find creator's Instagram access token from their social accounts
        String accessToken = findInstagramToken(submission);
        if (accessToken == null) {
            throw new IllegalArgumentException(
                    "No Instagram access token found for this creator. Please connect Instagram account first.");
        }

        String shortcode = instagramApiService.extractShortcode(contentUrl)
                .orElseThrow(() -> new IllegalArgumentException("Could not extract Instagram shortcode from URL"));

        // The shortcode needs to be converted to media ID via Instagram API
        // For simplicity, we'll use the shortcode as the media ID here
        // (in production you'd call the oembed or shortcode->ID endpoint)
        InstagramApiService.MediaInsights insights = instagramApiService
                .fetchMediaInsights(shortcode, accessToken)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Instagram media not found or insights unavailable for: " + shortcode));

        return ContentMetricSnapshot.builder()
                .submission(submission)
                .platform("INSTAGRAM")
                .views(insights.videoViews() > 0 ? insights.videoViews() : insights.impressions())
                .likes(insights.likeCount())
                .comments(insights.commentsCount())
                .shares(insights.saved())
                .reach(insights.reach())
                .engagementRate(insights.engagementRate())
                .capturedAt(LocalDateTime.now())
                .build();
    }

    private String findInstagramToken(Submission submission) {
        if (submission.getCreator() == null) return null;
        Long creatorId = submission.getCreator().getId();
        return socialAccountRepository.findByCreatorId(creatorId).stream()
                .filter(sa -> "INSTAGRAM".equalsIgnoreCase(sa.getPlatform()) && sa.getAccessToken() != null)
                .map(SocialAccount::getAccessToken)
                .findFirst()
                .orElse(null);
    }

    private boolean isInstagramUrl(String url) {
        return url != null && (url.contains("instagram.com/p/")
                || url.contains("instagram.com/reel/")
                || url.contains("instagram.com/tv/"));
    }

    private void updateLeaderboardForSubmission(Submission submission, ContentMetricSnapshot snapshot) {
        try {
            Long campaignId = submission.getCampaign().getId();
            Long creatorId = submission.getCreator().getId();

            LeaderboardEntry entry = leaderboardRepository
                    .findByCampaignIdAndCreatorId(campaignId, creatorId)
                    .orElseGet(() -> LeaderboardEntry.builder()
                            .campaign(submission.getCampaign())
                            .creator(submission.getCreator())
                            .views(0)
                            .engagement(0)
                            .conversions(0)
                            .score(0.0f)
                            .trend(0.0f)
                            .movement("NONE")
                            .build());

            int views = snapshot.getViews() != null ? (int) Math.min(snapshot.getViews(), Integer.MAX_VALUE) : 0;
            long likes = snapshot.getLikes() != null ? snapshot.getLikes() : 0;
            long comments = snapshot.getComments() != null ? snapshot.getComments() : 0;
            int engagement = (int) Math.min(likes + comments, Integer.MAX_VALUE);
            float score = (float) (views * 0.4 + engagement * 2.5);

            String movement = "STABLE";
            if (entry.getScore() != null && entry.getScore() > 0) {
                if (score > entry.getScore()) movement = "UP";
                else if (score < entry.getScore()) movement = "DOWN";
            } else {
                movement = "UP";
            }

            entry.setViews(views);
            entry.setEngagement(engagement);
            entry.setScore(score);
            entry.setTrend(movement.equals("UP") ? 1.0f : 0.0f);
            entry.setMovement(movement);
            entry.setCapturedAt(LocalDateTime.now());

            leaderboardRepository.save(entry);
        } catch (Exception e) {
            log.warn("Failed to automatically update leaderboard entry: {}", e.getMessage());
        }
    }

    private void evaluateFraudHeuristics(Submission submission, ContentMetricSnapshot snapshot) {
        try {
            long views = snapshot.getViews() != null ? snapshot.getViews() : 0;
            long likes = snapshot.getLikes() != null ? snapshot.getLikes() : 0;

            // Anomaly heuristic: High view velocity (>20k) with less than 5 likes
            if (views > 20000 && likes < 5) {
                var existing = fraudSignalRepository.findByCampaignIdAndCreatorId(
                        submission.getCampaign().getId(), submission.getCreator().getId());
                boolean alreadyFlagged = existing.stream().anyMatch(f -> "ENGAGEMENT_ANOMALY_BOT_SPIKE".equals(f.getSignalType()));

                if (!alreadyFlagged) {
                    FraudSignal signal = FraudSignal.builder()
                            .campaign(submission.getCampaign())
                            .creator(submission.getCreator())
                            .signalType("ENGAGEMENT_ANOMALY_BOT_SPIKE")
                            .severity(0.85f)
                            .status(com.viralwar.model.enums.FraudSignalStatus.REVIEW)
                            .evidence("Views (" + views + ") vastly exceed organic likes (" + likes + "). Ratio indicates automated traffic.")
                            .build();
                    fraudSignalRepository.save(signal);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to evaluate fraud heuristics: {}", e.getMessage());
        }
    }

    private MetricSnapshotResponse toResponse(ContentMetricSnapshot s) {
        return new MetricSnapshotResponse(
                s.getId(),
                s.getSubmission() != null ? s.getSubmission().getId() : null,
                s.getPlatform(),
                s.getViews(),
                s.getLikes(),
                s.getComments(),
                s.getShares(),
                s.getReach(),
                s.getEngagementRate(),
                s.getCapturedAt()
        );
    }
}
