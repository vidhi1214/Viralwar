package com.viralwar.service;

import com.viralwar.dto.metrics.MetricSnapshotResponse;
import com.viralwar.exception.ResourceNotFoundException;
import com.viralwar.model.ContentMetricSnapshot;
import com.viralwar.model.CreatorProfile;
import com.viralwar.model.SocialAccount;
import com.viralwar.model.Submission;
import com.viralwar.repository.ContentMetricSnapshotRepository;
import com.viralwar.repository.SocialAccountRepository;
import com.viralwar.repository.SubmissionRepository;
import com.viralwar.service.social.InstagramApiService;
import com.viralwar.service.social.YouTubeApiService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MetricsServiceTest {

    @Mock
    private YouTubeApiService youTubeApiService;

    @Mock
    private InstagramApiService instagramApiService;

    @Mock
    private SubmissionRepository submissionRepository;

    @Mock
    private ContentMetricSnapshotRepository snapshotRepository;

    @Mock
    private SocialAccountRepository socialAccountRepository;

    @Mock
    private com.viralwar.repository.LeaderboardEntryRepository leaderboardRepository;

    @Mock
    private com.viralwar.repository.FraudSignalRepository fraudSignalRepository;

    @InjectMocks
    private MetricsService metricsService;

    @Test
    @DisplayName("Refresh metrics for YouTube submission")
    void testRefreshMetricsYouTube() {
        Long submissionId = 100L;
        Submission submission = Submission.builder()
                .id(submissionId)
                .contentUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
                .build();

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));
        when(youTubeApiService.extractVideoId(submission.getContentUrl())).thenReturn(Optional.of("dQw4w9WgXcQ"));

        YouTubeApiService.VideoStats videoStats = new YouTubeApiService.VideoStats(
                "dQw4w9WgXcQ", "Title", "Channel", 1000000L, 50000L, 2000L, 0L
        );
        when(youTubeApiService.fetchVideoStats("dQw4w9WgXcQ")).thenReturn(Optional.of(videoStats));

        ContentMetricSnapshot savedSnapshot = ContentMetricSnapshot.builder()
                .id(1L)
                .submission(submission)
                .platform("YOUTUBE")
                .views(1000000L)
                .likes(50000L)
                .comments(2000L)
                .shares(0L)
                .reach(1000000L)
                .engagementRate(5.2)
                .capturedAt(LocalDateTime.now())
                .build();

        when(snapshotRepository.save(any(ContentMetricSnapshot.class))).thenReturn(savedSnapshot);

        MetricSnapshotResponse response = metricsService.refreshMetrics(submissionId);

        assertNotNull(response);
        assertEquals("YOUTUBE", response.platform());
        assertEquals(1000000L, response.views());
        assertEquals(50000L, response.likes());
        verify(snapshotRepository).save(any(ContentMetricSnapshot.class));
    }

    @Test
    @DisplayName("Refresh metrics for Instagram submission")
    void testRefreshMetricsInstagram() {
        Long submissionId = 200L;
        CreatorProfile creator = CreatorProfile.builder().id(50L).build();
        Submission submission = Submission.builder()
                .id(submissionId)
                .creator(creator)
                .contentUrl("https://www.instagram.com/reel/Cw99XYZ123/")
                .build();

        SocialAccount socialAccount = SocialAccount.builder()
                .id(1L)
                .creator(creator)
                .platform("INSTAGRAM")
                .accessToken("IG_ACCESS_TOKEN_123")
                .build();

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));
        when(youTubeApiService.extractVideoId(submission.getContentUrl())).thenReturn(Optional.empty());
        when(socialAccountRepository.findByCreatorId(50L)).thenReturn(List.of(socialAccount));
        when(instagramApiService.extractShortcode(submission.getContentUrl())).thenReturn(Optional.of("Cw99XYZ123"));

        InstagramApiService.MediaInsights insights = new InstagramApiService.MediaInsights(
                "Cw99XYZ123", "REEL", "Caption", "https://instagram.com", 25000L, 1200L, 50000L, 40000L, 800L, 45000L, "2026-10-13T00:00:00Z"
        );
        when(instagramApiService.fetchMediaInsights("Cw99XYZ123", "IG_ACCESS_TOKEN_123")).thenReturn(Optional.of(insights));

        ContentMetricSnapshot savedSnapshot = ContentMetricSnapshot.builder()
                .id(2L)
                .submission(submission)
                .platform("INSTAGRAM")
                .views(45000L)
                .likes(25000L)
                .comments(1200L)
                .shares(800L)
                .reach(40000L)
                .engagementRate(insights.engagementRate())
                .capturedAt(LocalDateTime.now())
                .build();

        when(snapshotRepository.save(any(ContentMetricSnapshot.class))).thenReturn(savedSnapshot);

        MetricSnapshotResponse response = metricsService.refreshMetrics(submissionId);

        assertNotNull(response);
        assertEquals("INSTAGRAM", response.platform());
        assertEquals(45000L, response.views());
        assertEquals(25000L, response.likes());
    }

    @Test
    @DisplayName("Refresh metrics for unsupported URL throws IllegalArgumentException")
    void testRefreshMetricsUnsupportedUrl() {
        Long submissionId = 300L;
        Submission submission = Submission.builder()
                .id(submissionId)
                .contentUrl("https://www.tiktok.com/@creator/video/12345")
                .build();

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));
        when(youTubeApiService.extractVideoId(submission.getContentUrl())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> metricsService.refreshMetrics(submissionId));
    }

    @Test
    @DisplayName("Refresh metrics for non-existent submission throws ResourceNotFoundException")
    void testRefreshMetricsNotFound() {
        when(submissionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> metricsService.refreshMetrics(999L));
    }
}
