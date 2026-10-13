package com.viralwar.service;

import com.viralwar.dto.campaign.CampaignCreateRequest;
import com.viralwar.dto.campaign.CampaignResponse;
import com.viralwar.exception.DuplicateResourceException;
import com.viralwar.exception.ResourceNotFoundException;
import com.viralwar.model.Brand;
import com.viralwar.model.Campaign;
import com.viralwar.model.enums.CampaignStatus;
import com.viralwar.repository.BrandRepository;
import com.viralwar.repository.CampaignRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;

/**
 * Campaign lifecycle management service.
 */
@Service
@RequiredArgsConstructor
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final BrandRepository brandRepository;

    @Transactional(readOnly = true)
    public Page<CampaignResponse> listAll(Pageable pageable) {
        return campaignRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<CampaignResponse> listByBrand(Long brandId, Pageable pageable) {
        return campaignRepository.findByBrandId(brandId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CampaignResponse findById(Long id) {
        return toResponse(campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign", id)));
    }

    @Transactional(readOnly = true)
    public CampaignResponse findBySlug(String slug) {
        return toResponse(campaignRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found with slug: " + slug)));
    }

    @Transactional
    public CampaignResponse create(Long brandId, CampaignCreateRequest req) {
        if (campaignRepository.existsBySlug(req.slug())) {
            throw new DuplicateResourceException("Campaign slug already taken: " + req.slug());
        }

        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", brandId));

        Campaign campaign = Campaign.builder()
                .brand(brand)
                .title(req.title())
                .slug(req.slug())
                .description(req.description())
                .product(req.product())
                .objective(req.objective())
                .status(CampaignStatus.DRAFT)
                .startAt(req.startAt())
                .endAt(req.endAt())
                .budget(req.budget())
                .prizePool(req.prizePool())
                .currency(req.currency() != null ? req.currency() : "INR")
                .rules(req.rules())
                .eligibility(req.eligibility())
                .platforms(req.platforms() != null ? new HashSet<>(req.platforms()) : new HashSet<>())
                .build();

        return toResponse(campaignRepository.save(campaign));
    }

    @Transactional
    public CampaignResponse updateStatus(Long id, String status) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign", id));
        try {
            campaign.setStatus(CampaignStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid campaign status: " + status);
        }
        return toResponse(campaignRepository.save(campaign));
    }

    @Transactional
    public void delete(Long id) {
        if (!campaignRepository.existsById(id)) {
            throw new ResourceNotFoundException("Campaign", id);
        }
        campaignRepository.deleteById(id);
    }

    private CampaignResponse toResponse(Campaign c) {
        return new CampaignResponse(
                c.getId(),
                c.getBrand() != null ? c.getBrand().getId() : null,
                c.getBrand() != null ? c.getBrand().getName() : null,
                c.getTitle(), c.getSlug(), c.getDescription(),
                c.getProduct(), c.getObjective(),
                c.getStatus() != null ? c.getStatus().name() : null,
                c.getStartAt(), c.getEndAt(),
                c.getBudget(), c.getPrizePool(), c.getCurrency(),
                c.getPlatforms(),
                c.getCreatedAt(), c.getUpdatedAt()
        );
    }
}
