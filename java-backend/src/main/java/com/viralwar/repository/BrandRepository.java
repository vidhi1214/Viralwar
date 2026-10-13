package com.viralwar.repository;

import com.viralwar.model.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Long> {

    @Query("SELECT b FROM Brand b WHERE b.slug = :slug")
    Optional<Brand> findBySlug(@Param("slug") String slug);

    @Query("SELECT b FROM Brand b WHERE b.name = :name")
    Optional<Brand> findByName(@Param("name") String name);
}