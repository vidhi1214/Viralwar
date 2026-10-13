package com.viralwar.repository;

import com.viralwar.model.LeaderboardEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LeaderboardEntryRepository extends JpaRepository<LeaderboardEntry, Long> {

    Page<LeaderboardEntry> findByCampaignId(Long campaignId, Pageable pageable);

    Page<LeaderboardEntry> findByCreatorId(Long creatorId, Pageable pageable);

    Optional<LeaderboardEntry> findByCampaignIdAndCreatorId(Long campaignId, Long creatorId);

    long countByCampaignId(Long campaignId);
}