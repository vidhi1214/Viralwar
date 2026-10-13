package com.viralwar.service;

import com.viralwar.dto.auth.AuthResponse;
import com.viralwar.dto.auth.LoginRequest;
import com.viralwar.dto.auth.RefreshTokenRequest;
import com.viralwar.dto.auth.RegisterRequest;
import com.viralwar.exception.DuplicateResourceException;
import com.viralwar.model.User;
import com.viralwar.model.enums.UserRole;
import com.viralwar.model.enums.UserStatus;
import com.viralwar.repository.BrandRepository;
import com.viralwar.repository.CreatorProfileRepository;
import com.viralwar.repository.OrganizationMembershipRepository;
import com.viralwar.repository.UserRepository;
import com.viralwar.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CreatorProfileRepository creatorProfileRepository;

    @Mock
    private BrandRepository brandRepository;

    @Mock
    private OrganizationMembershipRepository organizationMembershipRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "expirationMs", 3600000L);
    }

    @Test
    @DisplayName("Register new user successfully")
    void testRegisterSuccess() {
        RegisterRequest request = new RegisterRequest("creator@viralwar.com", "Secret@123", "CREATOR");

        when(userRepository.existsByEmail("creator@viralwar.com")).thenReturn(false);
        when(passwordEncoder.encode("Secret@123")).thenReturn("encodedPassword");

        User savedUser = User.builder()
                .id(1L)
                .email("creator@viralwar.com")
                .passwordHash("encodedPassword")
                .role(UserRole.CREATOR)
                .status(UserStatus.ACTIVE)
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtTokenProvider.generateAccessToken(any())).thenReturn("mock-access-token");
        when(jwtTokenProvider.generateRefreshToken(any())).thenReturn("mock-refresh-token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.accessToken());
        assertEquals("mock-refresh-token", response.refreshToken());
        assertEquals(1L, response.user().id());
        assertEquals("creator@viralwar.com", response.user().email());
        assertEquals("CREATOR", response.user().role());
    }

    @Test
    @DisplayName("Register with duplicate email throws DuplicateResourceException")
    void testRegisterDuplicateEmail() {
        RegisterRequest request = new RegisterRequest("creator@viralwar.com", "Secret@123", "CREATOR");

        when(userRepository.existsByEmail("creator@viralwar.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Login with valid credentials successfully")
    void testLoginSuccess() {
        LoginRequest request = new LoginRequest("creator@viralwar.com", "Secret@123");

        User user = User.builder()
                .id(1L)
                .email("creator@viralwar.com")
                .passwordHash("encodedPassword")
                .role(UserRole.CREATOR)
                .status(UserStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail("creator@viralwar.com")).thenReturn(Optional.of(user));
        when(jwtTokenProvider.generateAccessToken(any())).thenReturn("mock-access-token");
        when(jwtTokenProvider.generateRefreshToken(any())).thenReturn("mock-refresh-token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.accessToken());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("Login with bad credentials throws exception")
    void testLoginBadCredentials() {
        LoginRequest request = new LoginRequest("creator@viralwar.com", "WrongPassword");

        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("RefreshToken with valid token succeeds")
    void testRefreshTokenSuccess() {
        RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh-token");

        User user = User.builder()
                .id(1L)
                .email("creator@viralwar.com")
                .passwordHash("encodedPassword")
                .role(UserRole.CREATOR)
                .status(UserStatus.ACTIVE)
                .build();

        when(jwtTokenProvider.validateToken("valid-refresh-token")).thenReturn(true);
        when(jwtTokenProvider.extractUsername("valid-refresh-token")).thenReturn("creator@viralwar.com");
        when(userRepository.findByEmail("creator@viralwar.com")).thenReturn(Optional.of(user));
        when(jwtTokenProvider.generateAccessToken(any())).thenReturn("new-access-token");
        when(jwtTokenProvider.generateRefreshToken(any())).thenReturn("new-refresh-token");

        AuthResponse response = authService.refreshToken(request);

        assertNotNull(response);
        assertEquals("new-access-token", response.accessToken());
        assertEquals("new-refresh-token", response.refreshToken());
    }

    @Test
    @DisplayName("RefreshToken with invalid token throws IllegalArgumentException")
    void testRefreshTokenInvalid() {
        RefreshTokenRequest request = new RefreshTokenRequest("invalid-refresh-token");

        when(jwtTokenProvider.validateToken("invalid-refresh-token")).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> authService.refreshToken(request));
    }
}
