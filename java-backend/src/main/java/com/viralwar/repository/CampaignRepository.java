package com.viralwar.repository;

import com.viralwar.model.Campaign;
import com.viralwar.model.enums.CampaignStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, Long> {

    Page<Campaign> findByBrandId(Long brandId, Pageable pageable);

    Optional<Campaign> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Campaign> findByStatus(CampaignStatus status, Pageable pageable);

    @Query("SELECT c FROM Campaign c WHERE c.status = :status AND c.brand.id = :brandId")
    List<Campaign> findByStatusAndBrandId(@Param("status") CampaignStatus status, @Param("brandId") Long brandId);

    @Query("SELECT c FROM Campaign c WHERE LOWER(c.title) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<Campaign> searchByTitle(@Param("q") String q, Pageable pageable);
}