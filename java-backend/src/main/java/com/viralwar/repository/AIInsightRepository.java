package com.viralwar.repository;

import com.viralwar.model.AIInsight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AIInsightRepository extends JpaRepository<AIInsight, Long> {

    @Query("SELECT ai FROM AIInsight ai WHERE ai.campaign.id = :campaignId")
    Iterable<AIInsight> findByCampaignId(@Param("campaignId") Long campaignId);
}