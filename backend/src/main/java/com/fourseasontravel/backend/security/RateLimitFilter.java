package com.fourseasontravel.backend.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.TimeUnit;


public class RateLimitFilter extends OncePerRequestFilter {

    // Tự xóa IP sau 1 giờ không thao tác, tối đa lưu 5.000 IP
    private final Cache<String, Bucket> sensitiveBuckets = Caffeine.newBuilder()
            .expireAfterAccess(1, TimeUnit.HOURS)
            .maximumSize(5000)
            .build();

    // Tối đa lưu 5.000 IP đang cố đăng nhập
    private final Cache<String, Bucket> loginBuckets = Caffeine.newBuilder()
            .expireAfterAccess(1, TimeUnit.HOURS)
            .maximumSize(5000)
            .build();

    // Global thường có nhiều request hơn, cho phép lưu tối đa 10.000 IP
    private final Cache<String, Bucket> globalBuckets = Caffeine.newBuilder()
            .expireAfterAccess(1, TimeUnit.HOURS)
            .maximumSize(10000)
            .build();

    private Bucket createBucket(int capacity, int minutes) {
        Bandwidth limit = Bandwidth.classic(capacity,
                Refill.greedy(capacity, Duration.ofMinutes(minutes)));
        return Bucket.builder().addLimit(limit).build();
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) ip = request.getRemoteAddr();
        return ip.split(",")[0].trim();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();

        if (path.contains("/api/v1/upload") || !path.startsWith("/api/v1/")) {
            chain.doFilter(request, response);
            return;
        }

        // ==========================================================
        // 1. NHẬN DIỆN NGƯỜI DÙNG & QUYỀN (SAU KHI JWT ĐÃ GIẢI MÃ)
        // ==========================================================
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = false;
        boolean isAuthor = false;
        String userKey = getClientIp(request); // Mặc định dùng IP cho khách vãng lai

        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            userKey = auth.getName(); // Dùng Email làm thẻ định danh sẽ chính xác hơn IP

            // Dùng .contains() để bao quát cả trường hợp Role bị lưu là "ROLE_ADMIN" hay "ROLE_AUTHOR"
            isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().contains("ADMIN"));
            isAuthor = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().contains("AUTHOR"));
        }

        // ==========================================================
        // 2. MIỄN TỬ KIM BÀI CHO ADMIN (KHÔNG BAO GIỜ BỊ CHẶN)
        // ==========================================================
        if (isAdmin) {
            chain.doFilter(request, response);
            return;
        }

        // ==========================================================
        // 3. TÙY CHỈNH GIỚI HẠN
        // ==========================================================
        // Đã tăng số lượng lên để chịu tải được các app ReactJS gọi nhiều API cùng lúc
        // Author: 1000 req/phút | Người thường: 120 req/phút
        int globalLimit = isAuthor ? 1000 : 120;

        // Author: 100 req/phút | Người thường: 15 req/phút
        int sensitiveLimit = isAuthor ? 100 : 15;

        Bucket bucket;

        if (path.contains("/api/v1/auth/login")) {
            bucket = loginBuckets.get(userKey, k -> createBucket(20, 1));
        } else if (isSensitiveApi(path)) {
            bucket = sensitiveBuckets.get(userKey, k -> createBucket(sensitiveLimit, 1));
        } else {
            bucket = globalBuckets.get(userKey, k -> createBucket(globalLimit, 1));
        }

        // 4. KIỂM TRA QUẸT THẺ
        if (bucket.tryConsume(1)) {
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(bucket.getAvailableTokens()));
            chain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("""
                {
                    "error": "TOO_MANY_REQUESTS",
                    "message": "Bạn đã thao tác quá nhanh. Vui lòng đợi 1 phút để tiếp tục.",
                    "retryAfter": 60
                }
            """);
        }
    }

    private boolean isSensitiveApi(String path) {
        return path.contains("/api/v1/bookings")
                || path.contains("/api/v1/auth/register");
    }
}