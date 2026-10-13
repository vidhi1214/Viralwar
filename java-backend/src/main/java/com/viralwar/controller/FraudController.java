package com.viralwar.controller;

import com.viralwar.model.FraudSignal;
import com.viralwar.repository.FraudSignalRepository;
import com.viralwar.exception.ResourceNotFoundException;
import com.viralwar.model.enums.FraudSignalStatus;
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

/**
 * Fraud signals — detect and manage suspicious creator activity.
 */
@RestController
@RequestMapping("/fraud")
@RequiredArgsConstructor
@Tag(name = "Fraud Detection", description = "Fraud signals and creator risk management")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('BRAND', 'ADMIN')")
public class FraudController {

    private final FraudSignalRepository fraudSignalRepository;

    @GetMapping
    @Operation(summary = "List all fraud signals")
    public ResponseEntity<Page<FraudSignal>> listAll(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(fraudSignalRepository.findAll(pageable));
    }

    @GetMapping("/creator/{creatorId}")
    @Operation(summary = "Get fraud signals for a creator")
    public ResponseEntity<Page<FraudSignal>> byCreator(
            @PathVariable Long creatorId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(fraudSignalRepository.findByCreatorId(creatorId, pageable));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update fraud signal status (ADMIN only)",
            description = "Valid: CLEAR, REVIEW, RESTRICTED, CONFIRMED")
    public ResponseEntity<FraudSignal> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        FraudSignal signal = fraudSignalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FraudSignal", id));
        try {
            signal.setStatus(FraudSignalStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }
        return ResponseEntity.ok(fraudSignalRepository.save(signal));
    }
}
