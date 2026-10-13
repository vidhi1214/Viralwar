package com.viralwar.repository;

import com.viralwar.model.CreatorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CreatorProfileRepository extends JpaRepository<CreatorProfile, Long> {

    Optional<CreatorProfile> findByUsername(String username);

    Optional<CreatorProfile> findByUserId(Long userId);

    boolean existsByUsername(String username);
}