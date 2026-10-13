package com.viralwar.service.social;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class YouTubeApiServiceTest {

    @Mock
    private WebClient youtubeWebClient;

    private YouTubeApiService youTubeApiService;

    @BeforeEach
    void setUp() {
        youTubeApiService = new YouTubeApiService(youtubeWebClient);
        ReflectionTestUtils.setField(youTubeApiService, "apiKey", "test-api-key");
    }

    @Test
    @DisplayName("Extract video ID from standard watch URL")
    void testExtractVideoIdStandard() {
        Optional<String> id = youTubeApiService.extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        assertTrue(id.isPresent());
        assertEquals("dQw4w9WgXcQ", id.get());
    }

    @Test
    @DisplayName("Extract video ID from watch URL with extra params")
    void testExtractVideoIdWithParams() {
        Optional<String> id = youTubeApiService.extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&feature=shared");
        assertTrue(id.isPresent());
        assertEquals("dQw4w9WgXcQ", id.get());
    }

    @Test
    @DisplayName("Extract video ID from youtu.be short URL")
    void testExtractVideoIdShortLink() {
        Optional<String> id = youTubeApiService.extractVideoId("https://youtu.be/dQw4w9WgXcQ?si=abcdef");
        assertTrue(id.isPresent());
        assertEquals("dQw4w9WgXcQ", id.get());
    }

    @Test
    @DisplayName("Extract video ID from YouTube Shorts URL")
    void testExtractVideoIdShorts() {
        Optional<String> id = youTubeApiService.extractVideoId("https://www.youtube.com/shorts/xyz123abc?feature=share");
        assertTrue(id.isPresent());
        assertEquals("xyz123abc", id.get());
    }

    @Test
    @DisplayName("Invalid or non-YouTube URL returns empty")
    void testExtractVideoIdInvalid() {
        assertTrue(youTubeApiService.extractVideoId(null).isEmpty());
        assertTrue(youTubeApiService.extractVideoId("").isEmpty());
        assertTrue(youTubeApiService.extractVideoId("https://instagram.com/p/12345").isEmpty());
        assertTrue(youTubeApiService.extractVideoId("https://tiktok.com/@user/video/12345").isEmpty());
    }
}
