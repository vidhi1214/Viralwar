package com.viralwar.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.Set;

@Entity
@Table(name = "brands")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Brand {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 255)
    private String name;

    @Column(unique = true, nullable = false, length = 255)
    private String slug;

    @Column(length = 500)
    private String logo;

    @Column(length = 2000)
    private String description;

    @Column(length = 255)
    private String website;

    private Boolean verificationStatus = false;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "brand", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<OrganizationMembership> organizationMemberships;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "brand", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Campaign> campaigns;

    @PrePersist
    protected void onCreate() {
    }
}