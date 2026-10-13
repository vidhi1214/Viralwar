package com.viralwar.repository;

import com.viralwar.model.AttributionEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AttributionEventRepository extends JpaRepository<AttributionEvent, Long> {

    @Query("SELECT ae FROM AttributionEvent ae WHERE ae.campaign.id = :campaignId AND ae.creator.id = :creatorId")
    Iterable<AttributionEvent> findByCampaignIdAndCreatorId(
            @Param("campaignId") Long campaignId,
            @Param("creatorId") Long creatorId);

    @Query("SELECT ae FROM AttributionEvent ae WHERE ae.idempotencyKey = :idempotencyKey")
    Optional<AttributionEvent> findByIdempotencyKey(@Param("idempotencyKey") String idempotencyKey);
}