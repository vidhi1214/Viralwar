package com.viralwar.repository;

import com.viralwar.model.OrganizationMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrganizationMembershipRepository extends JpaRepository<OrganizationMembership, Long> {

    Optional<OrganizationMembership> findByUserId(Long userId);

    List<OrganizationMembership> findAllByUserId(Long userId);

    List<OrganizationMembership> findByBrandId(Long brandId);
}
