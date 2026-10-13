package com.viralwar.repository;

import com.viralwar.model.CampaignMetricConfig;
import com.viralwar.model.enums.CampaignMetricMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CampaignMetricConfigRepository extends JpaRepository<CampaignMetricConfig, Long> {

    @Query("SELECT c FROM CampaignMetricConfig c WHERE c.campaign.id = :campaignId")
    Iterable<CampaignMetricConfig> findByCampaignId(@Param("campaignId") Long campaignId);

    @Query("SELECT c FROM CampaignMetricConfig c WHERE c.campaign.id = :campaignId AND c.metric = :metric")
    Optional<CampaignMetricConfig> findByCampaignIdAndMetric(@Param("campaignId") Long campaignId, @Param("metric") CampaignMetricMetric metric);
}