package com.viralwar.repository;

import com.viralwar.model.Reward;
import com.viralwar.model.enums.RewardStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RewardRepository extends JpaRepository<Reward, Long> {

    @Query("SELECT r FROM Reward r WHERE r.campaign.id = :campaignId AND r.creator.id = :creatorId")
    Optional<Reward> findByCampaignIdAndCreatorId(
            @Param("campaignId") Long campaignId,
            @Param("creatorId") Long creatorId);

    @Query("SELECT r FROM Reward r WHERE r.campaign.id = :campaignId")
    Iterable<Reward> findByCampaignId(@Param("campaignId") Long campaignId);

    @Query("SELECT r FROM Reward r WHERE r.creator.id = :creatorId")
    Iterable<Reward> findByCreatorId(@Param("creatorId") Long creatorId);

    @Query("SELECT r FROM Reward r WHERE r.status = :status")
    Iterable<Reward> findByStatus(@Param("status") RewardStatus status);
}