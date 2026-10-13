package com.viralwar.repository;

import com.viralwar.model.CampaignParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CampaignParticipantRepository extends JpaRepository<CampaignParticipant, Long> {

    @Query("SELECT cp FROM CampaignParticipant cp WHERE cp.campaign.id = :campaignId AND cp.creator.id = :creatorId")
    Optional<CampaignParticipant> existsByCampaignIdAndCreatorId(
            @Param("campaignId") Long campaignId,
            @Param("creatorId") Long creatorId);

    @Query("SELECT cp FROM CampaignParticipant cp WHERE cp.campaign.id = :campaignId")
    Iterable<CampaignParticipant> findByCampaignId(@Param("campaignId") Long campaignId);
}