package com.viralwar.service.social;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.List;
import java.util.Optional;

/**
 * Instagram Graph API v20.0 integration.
 *
 * Fetches media insights (impressions, reach, likes, comments, shares, saves)
 * and basic account data using a user access token.
 *
 * IMPORTANT: Instagram Graph API requires a valid user access token
 * (not just an API key). The token must be stored per creator in SocialAccount.
 * This service receives the token as a parameter for each call.
 */
@Service
@RequiredArgsConstructor
public class InstagramApiService {

    private static final Logger log = LoggerFactory.getLogger(InstagramApiService.class);
    private static final String BASE_URL = "https://graph.instagram.com/v20.0";

    @Qualifier("instagramWebClient")
    private final WebClient instagramWebClient;

    // ─── Media Insights ───────────────────────────────────────────────────────

    /**
     * Fetches insights for an Instagram media post.
     *
     * @param mediaId     the Instagram media ID
     * @param accessToken the creator's valid access token
     * @return MediaInsights or empty on error
     */
    @Cacheable(value = "instagram-media-insights", key = "#mediaId")
    public Optional<MediaInsights> fetchMediaInsights(String mediaId, String accessToken) {
        try {
            // Step 1: get basic media fields
            InstagramMedia media = instagramWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/{mediaId}")
                            .queryParam("fields",
                                    "id,caption,media_type,timestamp,like_count,comments_count,permalink")
                            .queryParam("access_token", accessToken)
                            .build(mediaId))
                    .retrieve()
                    .bodyToMono(InstagramMedia.class)
                    .block();

            if (media == null) {
                log.warn("No Instagram media found for id: {}", mediaId);
                return Optional.empty();
            }

            // Step 2: fetch insights (only available for business/creator accounts)
            InstagramInsightsResponse insights = null;
            try {
                insights = instagramWebClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/{mediaId}/insights")
                                .queryParam("metric", "impressions,reach,saved,video_views")
                                .queryParam("access_token", accessToken)
                                .build(mediaId))
                        .retrieve()
                        .bodyToMono(InstagramInsightsResponse.class)
                        .block();
            } catch (WebClientResponseException e) {
                // Insights may not be available for personal accounts
                log.warn("Could not fetch Instagram insights for mediaId={}: {}", mediaId, e.getMessage());
            }

            long impressions = 0, reach = 0, saved = 0, videoViews = 0;
            if (insights != null && insights.data() != null) {
                for (InsightMetric metric : insights.data()) {
                    long val = metric.values() != null && !metric.values().isEmpty()
                            ? metric.values().get(0).value() : 0;
                    switch (metric.name()) {
                        case "impressions" -> impressions = val;
                        case "reach"       -> reach = val;
                        case "saved"       -> saved = val;
                        case "video_views" -> videoViews = val;
                    }
                }
            }

            return Optional.of(new MediaInsights(
                    mediaId,
                    media.mediaType(),
                    media.caption(),
                    media.permalink(),
                    media.likeCount(),
                    media.commentsCount(),
                    impressions,
                    reach,
                    saved,
                    videoViews,
                    media.timestamp()
            ));

        } catch (WebClientResponseException e) {
            log.error("Instagram API error for mediaId={}: HTTP {} - {}", mediaId, e.getStatusCode(), e.getMessage());
            return Optional.empty();
        } catch (Exception e) {
            log.error("Unexpected error fetching Instagram insights for mediaId={}: {}", mediaId, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Fetches basic account info for a creator.
     *
     * @param accessToken the user access token
     * @return AccountInfo or empty
     */
    @Cacheable(value = "instagram-account", key = "#accessToken.substring(0, 10)")
    public Optional<AccountInfo> fetchAccountInfo(String accessToken) {
        try {
            InstagramAccountResponse account = instagramWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/me")
                            .queryParam("fields", "id,username,name,biography,followers_count,media_count,profile_picture_url,website")
                            .queryParam("access_token", accessToken)
                            .build())
                    .retrieve()
                    .bodyToMono(InstagramAccountResponse.class)
                    .block();

            if (account == null) return Optional.empty();

            return Optional.of(new AccountInfo(
                    account.id(),
                    account.username(),
                    account.name(),
                    account.biography(),
                    account.followersCount(),
                    account.mediaCount(),
                    account.profilePictureUrl(),
                    account.website()
            ));

        } catch (WebClientResponseException e) {
            log.error("Instagram account API error: HTTP {} - {}", e.getStatusCode(), e.getMessage());
            return Optional.empty();
        } catch (Exception e) {
            log.error("Unexpected error fetching Instagram account: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Extracts Instagram media/post ID from a URL.
     * Supports: instagram.com/p/SHORTCODE, instagram.com/reel/SHORTCODE
     * NOTE: Instagram Graph API accepts shortcodes in /media?shortcode endpoint
     */
    public Optional<String> extractShortcode(String url) {
        if (url == null || url.isBlank()) return Optional.empty();
        for (String pattern : new String[]{"/p/", "/reel/", "/tv/"}) {
            if (url.contains(pattern)) {
                String after = url.substring(url.indexOf(pattern) + pattern.length());
                return Optional.of(after.split("[/?]")[0]);
            }
        }
        return Optional.empty();
    }

    // ─── Internal Response Records ────────────────────────────────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record InstagramMedia(
            String id,
            @JsonProperty("media_type") String mediaType,
            String caption,
            String permalink,
            @JsonProperty("like_count") long likeCount,
            @JsonProperty("comments_count") long commentsCount,
            String timestamp
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record InstagramInsightsResponse(List<InsightMetric> data) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record InsightMetric(
            String name, String period, List<InsightValue> values) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record InsightValue(long value, String endTime) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record InstagramAccountResponse(
            String id, String username, String name, String biography,
            @JsonProperty("followers_count") long followersCount,
            @JsonProperty("media_count") long mediaCount,
            @JsonProperty("profile_picture_url") String profilePictureUrl,
            String website
    ) {}

    // ─── Public Result Records ─────────────────────────────────────────────────

    public record MediaInsights(
            String mediaId,
            String mediaType,
            String caption,
            String permalink,
            long likeCount,
            long commentsCount,
            long impressions,
            long reach,
            long saved,
            long videoViews,
            String timestamp
    ) {
        public double engagementRate() {
            if (impressions == 0) return 0.0;
            return ((double) (likeCount + commentsCount + saved)) / impressions * 100.0;
        }
    }

    public record AccountInfo(
            String id,
            String username,
            String name,
            String biography,
            long followersCount,
            long mediaCount,
            String profilePictureUrl,
            String website
    ) {}
}
