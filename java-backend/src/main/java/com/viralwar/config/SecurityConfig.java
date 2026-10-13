package com.viralwar.config;

import com.viralwar.security.JwtAuthenticationEntryPoint;
import com.viralwar.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.viralwar.repository.UserRepository;

import java.util.Arrays;
import java.util.List;

/**
 * Full Spring Security 6 configuration with JWT stateless authentication.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final JwtAuthenticationEntryPoint jwtEntryPoint;
    private final UserRepository userRepository;

    @Value("${cors.allowed-origins}")
    private String[] allowedOrigins;

    /** Public endpoints that bypass JWT check */
    private static final String[] PUBLIC_PATHS = {
            "/auth/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/actuator/health",
            "/actuator/info",
            "/error"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtEntryPoint))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    // Public
                    .requestMatchers(PUBLIC_PATHS).permitAll()
                    // Public GET endpoints
                    .requestMatchers(org.springframework.http.HttpMethod.GET, "/campaigns/**", "/creators/**", "/leaderboard/**", "/brands/**").permitAll()
                    // Admin only
                    .requestMatchers("/admin/**").hasRole("ADMIN")
                    // Brand + Admin
                    .requestMatchers("/brands/**").hasAnyRole("BRAND", "ADMIN")
                    .requestMatchers("/fraud/**").hasAnyRole("BRAND", "ADMIN")
                    .requestMatchers("/rewards/**").hasAnyRole("BRAND", "ADMIN")
                    .requestMatchers("/payouts/**").hasAnyRole("BRAND", "ADMIN")
                    // Creator + Brand + Admin
                    .requestMatchers("/campaigns/**").hasAnyRole("BRAND", "ADMIN", "CREATOR")
                    .requestMatchers("/submissions/**").hasAnyRole("BRAND", "ADMIN", "CREATOR")
                    .requestMatchers("/creators/**").hasAnyRole("BRAND", "ADMIN", "CREATOR")
                    .requestMatchers("/social-accounts/**").hasAnyRole("CREATOR", "ADMIN")
                    .requestMatchers("/metrics/**").hasAnyRole("BRAND", "ADMIN", "CREATOR")
                    .requestMatchers("/leaderboard/**").hasAnyRole("BRAND", "ADMIN", "CREATOR")
                    // All authenticated
                    .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return email -> userRepository.findByEmail(email)
                .map(user -> org.springframework.security.core.userdetails.User
                        .withUsername(user.getEmail())
                        .password(user.getPasswordHash())
                        .roles(user.getRole().name())
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService());
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(Arrays.asList(allowedOrigins));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}