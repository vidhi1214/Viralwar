package com.viralwar.repository;

import com.viralwar.model.FraudSignal;
import com.viralwar.model.enums.FraudSignalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FraudSignalRepository extends JpaRepository<FraudSignal, Long> {

    Page<FraudSignal> findByCampaignId(Long campaignId, Pageable pageable);

    Page<FraudSignal> findByCreatorId(Long creatorId, Pageable pageable);

    List<FraudSignal> findByStatus(FraudSignalStatus status);

    List<FraudSignal> findByCampaignIdAndCreatorId(Long campaignId, Long creatorId);
}