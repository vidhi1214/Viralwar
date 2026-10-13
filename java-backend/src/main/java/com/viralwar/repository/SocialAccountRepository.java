package com.viralwar.repository;

import com.viralwar.model.SocialAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SocialAccountRepository extends JpaRepository<SocialAccount, Long> {

    List<SocialAccount> findByCreatorId(Long creatorId);

    Optional<SocialAccount> findByCreatorIdAndPlatform(Long creatorId, String platform);

    @Query("SELECT sa FROM SocialAccount sa WHERE sa.platform = :platform AND sa.creator.id = :creatorId")
    Optional<SocialAccount> findByPlatformAndCreatorId(
            @Param("platform") String platform, @Param("creatorId") Long creatorId);
}