package com.viralwar.repository;

import com.viralwar.model.ContentMetricSnapshot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ContentMetricSnapshotRepository extends JpaRepository<ContentMetricSnapshot, Long> {

    Page<ContentMetricSnapshot> findBySubmissionId(Long submissionId, Pageable pageable);

    @Query("SELECT cms FROM ContentMetricSnapshot cms WHERE cms.submission.id = :submissionId ORDER BY cms.capturedAt DESC LIMIT 1")
    Optional<ContentMetricSnapshot> findLatestBySubmissionId(@Param("submissionId") Long submissionId);
}