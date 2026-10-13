package com.viralwar.controller;

import com.viralwar.dto.submission.SubmissionCreateRequest;
import com.viralwar.model.Campaign;
import com.viralwar.model.CreatorProfile;
import com.viralwar.model.Submission;
import com.viralwar.repository.CampaignRepository;
import com.viralwar.repository.CreatorProfileRepository;
import com.viralwar.repository.SubmissionRepository;
import com.viralwar.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Submission management — creators submit content URLs for campaigns.
 */
@RestController
@RequestMapping("/submissions")
@RequiredArgsConstructor
@Tag(name = "Submissions", description = "Submit content for campaigns and manage moderation")
@SecurityRequirement(name = "bearerAuth")
public class SubmissionController {

    private final SubmissionRepository submissionRepository;
    private final CampaignRepository campaignRepository;
    private final CreatorProfileRepository creatorProfileRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('BRAND', 'ADMIN', 'CREATOR')")
    @Operation(summary = "List all submissions (paginated, with optional filtering)")
    public ResponseEntity<Page<Submission>> listAll(
            @RequestParam(required = false) Long campaignId,
            @RequestParam(required = false) Long creatorId,
            @PageableDefault(size = 20) Pageable pageable) {
        if (campaignId != null) {
            return ResponseEntity.ok(submissionRepository.findByCampaignId(campaignId, pageable));
        }
        if (creatorId != null) {
            return ResponseEntity.ok(submissionRepository.findByCreatorId(creatorId, pageable));
        }
        return ResponseEntity.ok(submissionRepository.findAll(pageable));
    }

    @GetMapping("/campaign/{campaignId}")
    @Operation(summary = "List submissions for a campaign")
    public ResponseEntity<Page<Submission>> byCampaign(
            @PathVariable Long campaignId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(submissionRepository.findByCampaignId(campaignId, pageable));
    }

    @GetMapping("/creator/{creatorId}")
    @Operation(summary = "List submissions by a creator")
    public ResponseEntity<Page<Submission>> byCreator(
            @PathVariable Long creatorId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(submissionRepository.findByCreatorId(creatorId, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get submission by ID")
    public ResponseEntity<Submission> findById(@PathVariable Long id) {
        return ResponseEntity.ok(submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", id)));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('CREATOR', 'ADMIN')")
    @Operation(summary = "Submit content for a campaign")
    public ResponseEntity<Submission> create(@Valid @RequestBody SubmissionCreateRequest req) {
        Campaign campaign = campaignRepository.findById(req.campaignId())
                .orElseThrow(() -> new ResourceNotFoundException("Campaign", req.campaignId()));
        CreatorProfile creator = creatorProfileRepository.findById(req.creatorId())
                .orElseThrow(() -> new ResourceNotFoundException("Creator", req.creatorId()));

        Submission submission = Submission.builder()
                .campaign(campaign)
                .creator(creator)
                .contentUrl(req.contentUrl())
                .platform(req.platform())
                .contentType(req.contentType())
                .caption(req.caption())
                .status("PENDING")
                .moderationStatus("PENDING")
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(submissionRepository.save(submission));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('BRAND', 'ADMIN')")
    @Operation(summary = "Approve a submission")
    public ResponseEntity<Submission> approve(@PathVariable Long id) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", id));
        submission.setModerationStatus("APPROVED");
        submission.setStatus("LIVE");
        return ResponseEntity.ok(submissionRepository.save(submission));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('BRAND', 'ADMIN')")
    @Operation(summary = "Reject a submission")
    public ResponseEntity<Submission> reject(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", id));
        submission.setModerationStatus("REJECTED");
        submission.setStatus("REJECTED");
        return ResponseEntity.ok(submissionRepository.save(submission));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('BRAND', 'ADMIN')")
    @Operation(summary = "Update submission status (e.g. APPROVED, REJECTED, LIVE, PENDING)")
    public ResponseEntity<Submission> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", id));
        String upper = status.toUpperCase();
        if ("APPROVED".equals(upper) || "LIVE".equals(upper)) {
            submission.setModerationStatus("APPROVED");
            submission.setStatus("LIVE");
        } else if ("REJECTED".equals(upper)) {
            submission.setModerationStatus("REJECTED");
            submission.setStatus("REJECTED");
        } else {
            submission.setModerationStatus(upper);
            submission.setStatus(upper);
        }
        return ResponseEntity.ok(submissionRepository.save(submission));
    }
}
