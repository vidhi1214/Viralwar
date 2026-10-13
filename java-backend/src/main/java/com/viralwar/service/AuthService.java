package com.viralwar.service;

import com.viralwar.dto.auth.AuthResponse;
import com.viralwar.dto.auth.LoginRequest;
import com.viralwar.dto.auth.RefreshTokenRequest;
import com.viralwar.dto.auth.RegisterRequest;
import com.viralwar.exception.DuplicateResourceException;
import com.viralwar.model.Brand;
import com.viralwar.model.CreatorProfile;
import com.viralwar.model.OrganizationMembership;
import com.viralwar.model.User;
import com.viralwar.repository.BrandRepository;
import com.viralwar.repository.CreatorProfileRepository;
import com.viralwar.repository.OrganizationMembershipRepository;
import com.viralwar.repository.UserRepository;
import com.viralwar.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.viralwar.model.enums.UserRole;
import com.viralwar.model.enums.UserStatus;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Handles user registration, login, and token refresh with automatic
 * profile binding for Creators and Brands.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CreatorProfileRepository creatorProfileRepository;
    private final BrandRepository brandRepository;
    private final OrganizationMembershipRepository organizationMembershipRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Email already registered: " + request.email());
        }

        UserRole role = parseRole(request.role());

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(role)
                .status(UserStatus.ACTIVE)
                .build();

        User saved = userRepository.save(user);

        String emailPrefix = request.email().split("@")[0].toLowerCase().replaceAll("[^a-z0-9]", "");
        if (emailPrefix.isBlank()) emailPrefix = "user" + saved.getId();

        String displayName = (request.displayName() != null && !request.displayName().isBlank())
                ? request.displayName()
                : (request.email().split("@")[0]);

        if (role == UserRole.CREATOR && creatorProfileRepository != null) {
            String handle = (request.handle() != null && !request.handle().isBlank())
                    ? request.handle().toLowerCase().replaceAll("[^a-z0-9_]", "")
                    : emailPrefix;

            if (creatorProfileRepository.existsByUsername(handle)) {
                handle = handle + "_" + saved.getId();
            }

            CreatorProfile profile = CreatorProfile.builder()
                    .user(saved)
                    .username(handle)
                    .displayName(displayName)
                    .bio("Viral creator on ViralWar")
                    .followerCount(1000)
                    .verifiedStatus(false)
                    .reputationScore(95.0f)
                    .categories(Set.of("LIFESTYLE", "CREATIVE"))
                    .build();
            creatorProfileRepository.save(profile);
        } else if (role == UserRole.BRAND && brandRepository != null && organizationMembershipRepository != null) {
            String brandName = displayName.endsWith("Brand") || displayName.endsWith("Studio") ? displayName : displayName + " Brand";
            String slug = brandName.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "") + "-" + saved.getId();

            Brand brand = Brand.builder()
                    .name(brandName)
                    .slug(slug)
                    .description("Official brand campaign account")
                    .verificationStatus(true)
                    .build();
            Brand savedBrand = brandRepository.save(brand);

            OrganizationMembership membership = OrganizationMembership.builder()
                    .organizationId(UUID.randomUUID().toString())
                    .user(saved)
                    .brand(savedBrand)
                    .role("OWNER")
                    .build();
            organizationMembershipRepository.save(membership);
        }

        return buildAuthResponse(saved);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.refreshToken();
        if (!jwtTokenProvider.validateToken(token)) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }

        String email = jwtTokenProvider.extractUsername(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        var springUser = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .roles(user.getRole().name())
                .build();

        String accessToken = jwtTokenProvider.generateAccessToken(springUser);
        String refreshToken = jwtTokenProvider.generateRefreshToken(springUser);

        Long creatorId = null;
        Long brandId = null;
        String displayName = user.getEmail().split("@")[0];

        if (creatorProfileRepository != null) {
            Optional<CreatorProfile> creatorOpt = creatorProfileRepository.findByUserId(user.getId());
            if (creatorOpt.isPresent()) {
                creatorId = creatorOpt.get().getId();
                displayName = creatorOpt.get().getDisplayName();
            }
        }

        if (organizationMembershipRepository != null) {
            Optional<OrganizationMembership> orgOpt = organizationMembershipRepository.findByUserId(user.getId());
            if (orgOpt.isPresent() && orgOpt.get().getBrand() != null) {
                brandId = orgOpt.get().getBrand().getId();
                displayName = orgOpt.get().getBrand().getName();
            }
        }

        return AuthResponse.of(
                accessToken, refreshToken, expirationMs / 1000,
                user.getId(), user.getEmail(),
                user.getRole().name(), user.getStatus().name(),
                creatorId, brandId, displayName
        );
    }

    private UserRole parseRole(String roleStr) {
        try {
            return UserRole.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + roleStr + ". Must be CREATOR, BRAND, or ADMIN");
        }
    }
}