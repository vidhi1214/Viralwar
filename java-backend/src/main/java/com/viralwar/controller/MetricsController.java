package com.viralwar.controller;

import com.viralwar.dto.metrics.MetricSnapshotResponse;
import com.viralwar.service.MetricsService;
import com.viralwar.service.social.YouTubeApiService;
import com.viralwar.service.social.InstagramApiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Live social media metrics — pulls from YouTube & Instagram APIs and persists snapshots.
 */
@RestController
@RequestMapping("/metrics")
@RequiredArgsConstructor
@Tag(name = "Metrics", description = "Live content metrics via YouTube and Instagram APIs")
@SecurityRequirement(name = "bearerAuth")
public class MetricsController {

    private final MetricsService metricsService;
    private final YouTubeApiService youTubeApiService;
    private final InstagramApiService instagramApiService;

    // ─── Snapshots ────────────────────────────────────────────────────────────

    @PostMapping({"/submissions/{submissionId}/refresh", "/refresh/{submissionId}"})
    @PreAuthorize("hasAnyRole('BRAND', 'ADMIN', 'CREATOR')")
    @Operation(summary = "Refresh live metrics for a submission",
            description = "Calls YouTube or Instagram API based on the content URL. Returns and persists a new snapshot.")
    public ResponseEntity<MetricSnapshotResponse> refreshMetrics(@PathVariable Long submissionId) {
        return ResponseEntity.ok(metricsService.refreshMetrics(submissionId));
    }

    @GetMapping({"/submissions/{submissionId}", "/submission/{submissionId}"})
    @Operation(summary = "List all metric snapshots for a submission (paginated)")
    public ResponseEntity<Page<MetricSnapshotResponse>> getSnapshots(
            @PathVariable Long submissionId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(metricsService.getSnapshots(submissionId, pageable));
    }

    // ─── YouTube Live Lookup ──────────────────────────────────────────────────

    @GetMapping("/youtube/video/{videoId}")
    @PreAuthorize("hasAnyRole('BRAND', 'ADMIN', 'CREATOR')")
    @Operation(summary = "Fetch live YouTube video stats by video ID",
            description = "Calls YouTube Data API v3. Returns views, likes, comments, and engagement rate.")
    public ResponseEntity<?> youtubeVideoStats(@PathVariable String videoId) {
        return youTubeApiService.fetchVideoStats(videoId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/youtube/channel/{channelId}")
    @PreAuthorize("hasAnyRole('BRAND', 'ADMIN')")
    @Operation(summary = "Fetch live YouTube channel stats by channel ID",
            description = "Returns subscriber count, video count, and total views.")
    public ResponseEntity<?> youtubeChannelStats(@PathVariable String channelId) {
        return youTubeApiService.fetchChannelStats(channelId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/youtube/extract-id")
    @Operation(summary = "Extract YouTube video ID from a URL")
    public ResponseEntity<Map<String, String>> extractYouTubeId(@RequestParam String url) {
        return youTubeApiService.extractVideoId(url)
                .map(id -> ResponseEntity.ok(Map.of("videoId", id)))
                .orElse(ResponseEntity.badRequest().body(Map.of("error", "Could not extract video ID from URL")));
    }

    // ─── Instagram Live Lookup ────────────────────────────────────────────────

    @GetMapping("/instagram/media/{mediaId}")
    @PreAuthorize("hasAnyRole('BRAND', 'ADMIN', 'CREATOR')")
    @Operation(summary = "Fetch live Instagram media insights",
            description = "Requires creator's access_token as query param. Returns impressions, reach, likes, engagement rate.")
    public ResponseEntity<?> instagramMediaInsights(
            @PathVariable String mediaId,
            @RequestParam String accessToken) {
        return instagramApiService.fetchMediaInsights(mediaId, accessToken)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/instagram/account")
    @PreAuthorize("hasAnyRole('BRAND', 'ADMIN', 'CREATOR')")
    @Operation(summary = "Fetch Instagram account info",
            description = "Requires a valid user access_token. Returns followers count, media count, profile data.")
    public ResponseEntity<?> instagramAccountInfo(@RequestParam String accessToken) {
        return instagramApiService.fetchAccountInfo(accessToken)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
