package com.fourseasontravel.backend.config;

import com.fourseasontravel.backend.security.JwtFilter;
import com.fourseasontravel.backend.security.RateLimitFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
public class SecurityConfig {

    // Công cụ băm mật khẩu
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Autowired
    private JwtFilter jwtFilter;


    // Cấu hình phân quyền và CORS
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration config = new CorsConfiguration();
                    config.setAllowedOrigins(List.of("http://localhost:3000"));
                    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    config.setAllowedHeaders(List.of("*"));
                    return config;
                }))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // ── Public hoàn toàn ──────────────────────────────────────
                        .requestMatchers("/api/v1/auth/**", "/error").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/v1/search/**").permitAll()

                        .requestMatchers("/api/v1/auth/register/send-otp").permitAll()
                        .requestMatchers("/api/v1/auth/register/verify-otp").permitAll()

                        .requestMatchers("/api/v1/auth/forgot-password").permitAll()
                        .requestMatchers("/api/v1/auth/change-password").authenticated()
                        .requestMatchers("/api/v1/auth/must-change-password").authenticated()

                        // Bất kỳ ai đăng nhập cũng được quyền xem/sửa hồ sơ CỦA CHÍNH MÌNH
                        .requestMatchers(HttpMethod.GET, "/api/v1/users/me").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/v1/users/me").authenticated()

                        // ── AUTHOR + ADMIN: my-tours, my-articles ─────────────────
                        // Phải đặt TRƯỚC rule permitAll GET bên dưới
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/tours/my-tours",
                                "/api/v1/articles/my-articles"
                        ).hasAnyAuthority("AUTHOR", "ADMIN")

                        // ── ADMIN only: duyệt tour/bài viết ──────────────────────
                        .requestMatchers(HttpMethod.PUT,
                                "/api/v1/tours/*/approve",
                                "/api/v1/tours/*/reject",
                                "/api/v1/articles/*/approve",
                                "/api/v1/articles/*/reject"
                        ).hasAuthority("ADMIN")

                        // ── ADMIN only: pending list ──────────────────────────────
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/tours/pending",
                                "/api/v1/articles/pending",
                                "/api/v1/tours/approved",
                                "/api/v1/articles/approved",
                                "/api/v1/users/**",
                                "/api/v1/revenue/**"
                        ).hasAuthority("ADMIN")

                        // ── Public GET (đặt SAU các rule cụ thể) ─────────────────
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/tours/**",
                                "/api/v1/locations/**",
                                "/api/v1/articles/**"
                        ).permitAll()

                        // ── ADMIN only: thêm/xóa location ────────────────────────
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/locations/**"
                        ).hasAuthority("ADMIN")
                        .requestMatchers(HttpMethod.DELETE,
                                "/api/v1/locations/**",
                                "/api/v1/users/**"
                        ).hasAuthority("ADMIN")

                        // ── AUTHOR + ADMIN: tạo tour/bài viết, upload ────────────
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/tours/**",
                                "/api/v1/articles/**"
                        ).hasAnyAuthority("AUTHOR", "ADMIN")
                        .requestMatchers(
                                "/api/v1/upload/**"
                        ).hasAnyAuthority("AUTHOR", "ADMIN")

                        // ── Đăng nhập mới dùng được ───────────────────────────────
                        .requestMatchers(
                                "/api/v1/bookings/**"
                        ).authenticated()

                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/bookings/my-bookings",
                                "/api/v1/bookings/check-joined"
                        ).authenticated()

                        .requestMatchers(HttpMethod.PUT,
                                "/api/v1/bookings/*/cancel-by-user"
                        ).authenticated()

                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/bookings/*/rate"
                        ).authenticated()

                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/bookings/tour/*"
                        ).hasAnyAuthority("AUTHOR", "ADMIN")

                        .requestMatchers(HttpMethod.PUT,
                                "/api/v1/bookings/*/check-in",
                                "/api/v1/bookings/*/no-show"
                        ).hasAnyAuthority("AUTHOR", "ADMIN")


                        .requestMatchers(HttpMethod.GET,  "/api/v1/search/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/search/sync/**").hasAuthority("ADMIN")

                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/v1/favorites/**").authenticated()

                        .requestMatchers(HttpMethod.GET, "/api/v1/tours/**", "/api/v1/locations/**", "/api/v1/articles/**", "/api/v1/reviews/**").permitAll()


                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/tours/*/departures"
                        ).hasAnyAuthority("AUTHOR", "ADMIN")

                        .requestMatchers(HttpMethod.PUT,
                                "/api/v1/tours/*/departures/*"
                        ).hasAnyAuthority("AUTHOR", "ADMIN")

                        .requestMatchers(HttpMethod.DELETE,
                                "/api/v1/tours/*/departures/*"
                        ).hasAnyAuthority("AUTHOR", "ADMIN")

                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/tours/*/departures"
                        ).permitAll()

                        .requestMatchers(HttpMethod.DELETE,
                                "/api/v1/auth/delete-account").authenticated()

                        // ── Còn lại phải đăng nhập ────────────────────────────────
                        .anyRequest().authenticated()
                )
                // 1. Kích hoạt Bác bảo vệ (JwtFilter) chạy TRƯỚC
                .addFilterBefore(jwtFilter, org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)

                // 2. THÊM MỚI: Kích hoạt bộ đếm Rate Limit chạy SAU khi JwtFilter đã nhận diện được danh tính
                .addFilterAfter(new RateLimitFilter(), org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}