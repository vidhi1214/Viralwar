package com.viralwar.controller;

import com.viralwar.dto.campaign.CampaignCreateRequest;
import com.viralwar.dto.campaign.CampaignResponse;
import com.viralwar.service.CampaignService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
 * Campaign management — CRUD + status transitions.
 * Accessible by BRAND and ADMIN (write) or CREATOR (read).
 */
@RestController
@RequestMapping("/campaigns")
@RequiredArgsConstructor
@Tag(name = "Campaigns", description = "Create and manage influencer campaigns")
@SecurityRequirement(name = "bearerAuth")
public class CampaignController {

    private final CampaignService campaignService;

    @GetMapping
    @Operation(summary = "List all campaigns (paginated)")
    public ResponseEntity<Page<CampaignResponse>> listAll(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(campaignService.listAll(pageable));
    }

    @GetMapping("/brand/{brandId}")
    @Operation(summary = "List campaigns by brand")
    public ResponseEntity<Page<CampaignResponse>> listByBrand(
            @PathVariable Long brandId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(campaignService.listByBrand(brandId, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get campaign by ID")
    public ResponseEntity<CampaignResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(campaignService.findById(id));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get campaign by slug")
    public ResponseEntity<CampaignResponse> findBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(campaignService.findBySlug(slug));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('BRAND', 'ADMIN')")
    @Operation(summary = "Create a new campaign (with brandId query param)")
    public ResponseEntity<CampaignResponse> createWithParam(
            @RequestParam(required = false) Long brandId,
            @Valid @RequestBody CampaignCreateRequest request) {
        Long targetBrandId = (brandId != null && brandId > 0) ? brandId : 1L;
        return ResponseEntity.status(HttpStatus.CREATED).body(campaignService.create(targetBrandId, request));
    }

    @PostMapping("/brand/{brandId}")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('BRAND', 'ADMIN')")
    @Operation(summary = "Create a new campaign")
    public ResponseEntity<CampaignResponse> create(
            @PathVariable Long brandId,
            @Valid @RequestBody CampaignCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(campaignService.create(brandId, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('BRAND', 'ADMIN')")
    @Operation(summary = "Update campaign status",
            description = "Valid statuses: DRAFT, REVIEW, SCHEDULED, ACTIVE, PAUSED, ENDED, SETTLING, COMPLETED, CANCELLED")
    public ResponseEntity<CampaignResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam @Parameter(description = "New status value") String status) {
        return ResponseEntity.ok(campaignService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete campaign (ADMIN only)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        campaignService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
