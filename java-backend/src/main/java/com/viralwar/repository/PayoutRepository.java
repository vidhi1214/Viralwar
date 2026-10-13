package com.viralwar.repository;

import com.viralwar.model.Payout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PayoutRepository extends JpaRepository<Payout, Long> {

    @Query("SELECT p FROM Payout p WHERE p.reward.id = :rewardId")
    Iterable<Payout> findByRewardId(@Param("rewardId") Long rewardId);

    @Query("SELECT p FROM Payout p WHERE p.status = :status")
    Iterable<Payout> findByStatus(@Param("status") String status);
}