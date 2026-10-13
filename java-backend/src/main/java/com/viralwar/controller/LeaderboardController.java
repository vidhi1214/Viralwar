package com.viralwar.controller;

import com.viralwar.model.LeaderboardEntry;
import com.viralwar.repository.LeaderboardEntryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Leaderboard — ranked creator scores per campaign.
 */
@RestController
@RequestMapping("/leaderboard")
@RequiredArgsConstructor
@Tag(name = "Leaderboard", description = "Campaign creator rankings and scores")
@SecurityRequirement(name = "bearerAuth")
public class LeaderboardController {

    private final LeaderboardEntryRepository leaderboardEntryRepository;

    @GetMapping("/campaign/{campaignId}")
    @Operation(summary = "Get leaderboard for a campaign",
            description = "Returns ranked list of creators sorted by score descending.")
    public ResponseEntity<Page<LeaderboardEntry>> byCampaign(
            @PathVariable Long campaignId,
            @PageableDefault(size = 20, sort = "score", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(leaderboardEntryRepository.findByCampaignId(campaignId, pageable));
    }

    @GetMapping("/creator/{creatorId}")
    @Operation(summary = "Get all leaderboard entries for a creator")
    public ResponseEntity<Page<LeaderboardEntry>> byCreator(
            @PathVariable Long creatorId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(leaderboardEntryRepository.findByCreatorId(creatorId, pageable));
    }
}
