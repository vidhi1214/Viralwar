package com.viralwar.service.social;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class InstagramApiServiceTest {

    @Mock
    private WebClient instagramWebClient;

    private InstagramApiService instagramApiService;

    @BeforeEach
    void setUp() {
        instagramApiService = new InstagramApiService(instagramWebClient);
    }

    @Test
    @DisplayName("Extract shortcode from Instagram post URL")
    void testExtractShortcodePost() {
        Optional<String> code = instagramApiService.extractShortcode("https://www.instagram.com/p/DA12345XYZ/");
        assertTrue(code.isPresent());
        assertEquals("DA12345XYZ", code.get());
    }

    @Test
    @DisplayName("Extract shortcode from Instagram reel URL")
    void testExtractShortcodeReel() {
        Optional<String> code = instagramApiService.extractShortcode("https://www.instagram.com/reel/Cw99XYZ123/?igsh=abc");
        assertTrue(code.isPresent());
        assertEquals("Cw99XYZ123", code.get());
    }

    @Test
    @DisplayName("Extract shortcode from Instagram TV URL")
    void testExtractShortcodeTv() {
        Optional<String> code = instagramApiService.extractShortcode("https://www.instagram.com/tv/B89abcXYZ/");
        assertTrue(code.isPresent());
        assertEquals("B89abcXYZ", code.get());
    }

    @Test
    @DisplayName("Invalid or non-Instagram URL returns empty")
    void testExtractShortcodeInvalid() {
        assertTrue(instagramApiService.extractShortcode(null).isEmpty());
        assertTrue(instagramApiService.extractShortcode("").isEmpty());
        assertTrue(instagramApiService.extractShortcode("https://youtube.com/watch?v=123").isEmpty());
    }
}
