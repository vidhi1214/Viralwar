package com.viralwar.repository;

import com.viralwar.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT al FROM AuditLog al WHERE al.actor.id = :actorId")
    Iterable<AuditLog> findByActorId(@Param("actorId") Long actorId);

    @Query("SELECT al FROM AuditLog al WHERE al.entityType = :entityType AND al.entityId = :entityId")
    Iterable<AuditLog> findByEntity(@Param("entityType") String entityType, @Param("entityId") String entityId);
}