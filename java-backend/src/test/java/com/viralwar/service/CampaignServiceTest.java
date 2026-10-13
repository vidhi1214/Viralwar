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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CampaignServiceTest {

    @Mock
    private CampaignRepository campaignRepository;

    @Mock
    private BrandRepository brandRepository;

    @InjectMocks
    private CampaignService campaignService;

    @Test
    @DisplayName("Create campaign successfully")
    void testCreateCampaignSuccess() {
        CampaignCreateRequest request = new CampaignCreateRequest(
                "Viral Summer Fest", "viral-summer-fest", "Summer hype campaign",
                "App v2", "AWARENESS",
                LocalDateTime.now().plusDays(1), LocalDateTime.now().plusDays(30),
                100000.0f, 50000.0f, "INR",
                "Post video with hashtag #viral", "Min 1k followers",
                Set.of("YOUTUBE", "INSTAGRAM")
        );

        Brand brand = Brand.builder().id(10L).name("Nike").build();

        when(campaignRepository.existsBySlug("viral-summer-fest")).thenReturn(false);
        when(brandRepository.findById(10L)).thenReturn(Optional.of(brand));

        Campaign saved = Campaign.builder()
                .id(1L)
                .brand(brand)
                .title(request.title())
                .slug(request.slug())
                .status(CampaignStatus.DRAFT)
                .budget(request.budget())
                .prizePool(request.prizePool())
                .currency("INR")
                .platforms(Set.of("YOUTUBE", "INSTAGRAM"))
                .build();

        when(campaignRepository.save(any(Campaign.class))).thenReturn(saved);

        CampaignResponse response = campaignService.create(10L, request);

        assertNotNull(response);
        assertEquals("viral-summer-fest", response.slug());
        assertEquals("DRAFT", response.status());
        verify(campaignRepository).save(any(Campaign.class));
    }

    @Test
    @DisplayName("Create campaign with duplicate slug throws exception")
    void testCreateDuplicateSlug() {
        CampaignCreateRequest request = new CampaignCreateRequest(
                "Duplicate", "duplicate-slug", "Desc",
                "Product", "Obj",
                null, null,
                0.0f, 0.0f, "INR",
                null, null, Set.of()
        );

        when(campaignRepository.existsBySlug("duplicate-slug")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> campaignService.create(1L, request));
        verify(campaignRepository, never()).save(any());
    }

    @Test
    @DisplayName("Find campaign by slug")
    void testFindBySlug() {
        Campaign campaign = Campaign.builder()
                .id(1L)
                .title("Winter War")
                .slug("winter-war")
                .status(CampaignStatus.ACTIVE)
                .currency("INR")
                .build();

        when(campaignRepository.findBySlug("winter-war")).thenReturn(Optional.of(campaign));

        CampaignResponse response = campaignService.findBySlug("winter-war");

        assertNotNull(response);
        assertEquals("winter-war", response.slug());
    }

    @Test
    @DisplayName("Find non-existing campaign by slug throws ResourceNotFoundException")
    void testFindBySlugNotFound() {
        when(campaignRepository.findBySlug("missing")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> campaignService.findBySlug("missing"));
    }

    @Test
    @DisplayName("List all campaigns paginated")
    void testListAll() {
        Campaign c = Campaign.builder().id(1L).title("Test").slug("test").status(CampaignStatus.ACTIVE).currency("INR").build();
        when(campaignRepository.findAll(PageRequest.of(0, 10))).thenReturn(new PageImpl<>(List.of(c)));

        Page<CampaignResponse> result = campaignService.listAll(PageRequest.of(0, 10));

        assertEquals(1, result.getTotalElements());
        assertEquals("test", result.getContent().get(0).slug());
    }

    @Test
    @DisplayName("Update campaign status")
    void testUpdateStatus() {
        Campaign c = Campaign.builder().id(1L).status(CampaignStatus.DRAFT).currency("INR").build();
        when(campaignRepository.findById(1L)).thenReturn(Optional.of(c));
        when(campaignRepository.save(any(Campaign.class))).thenReturn(c);

        CampaignResponse response = campaignService.updateStatus(1L, "ACTIVE");

        assertEquals("ACTIVE", response.status());
    }
}
