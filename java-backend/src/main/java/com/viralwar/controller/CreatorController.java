package com.viralwar.controller;

import com.viralwar.model.CreatorProfile;
import com.viralwar.repository.CreatorProfileRepository;
import com.viralwar.exception.ResourceNotFoundException;
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
 * Creator profile management.
 */
@RestController
@RequestMapping("/creators")
@RequiredArgsConstructor
@Tag(name = "Creators", description = "Creator profile discovery and management")
@SecurityRequirement(name = "bearerAuth")
public class CreatorController {

    private final CreatorProfileRepository creatorProfileRepository;

    @GetMapping
    @Operation(summary = "List all creators (paginated)")
    public ResponseEntity<Page<?>> listAll(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(creatorProfileRepository.findAll(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get creator by ID")
    public ResponseEntity<CreatorProfile> findById(@PathVariable Long id) {
        return ResponseEntity.ok(
                creatorProfileRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Creator", id))
        );
    }

    @GetMapping("/username/{username}")
    @Operation(summary = "Get creator by username")
    public ResponseEntity<CreatorProfile> findByUsername(@PathVariable String username) {
        return creatorProfileRepository.findByUsername(username)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Creator not found with username: " + username));
    }

    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toggle creator verified status (ADMIN only)")
    public ResponseEntity<Map<String, Object>> toggleVerify(@PathVariable Long id) {
        CreatorProfile creator = creatorProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Creator", id));
        creator.setVerifiedStatus(!creator.getVerifiedStatus());
        creatorProfileRepository.save(creator);
        return ResponseEntity.ok(Map.of("id", id, "verified", creator.getVerifiedStatus()));
    }
}
