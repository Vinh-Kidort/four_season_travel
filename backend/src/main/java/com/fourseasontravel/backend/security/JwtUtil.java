package com.fourseasontravel.backend.security;

import org.springframework.beans.factory.annotation.Value;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
    // Chìa khóa bí mật để ký Token (Phải giữ kín, dài ít nhất 32 ký tự)
    @Value("${jwt.secret-key}")
    private String SECRET_KEY;

    // Thời gian sống của Token: 1 ngày (86400000 millisecond)


    private static final long ACCESS_TOKEN_EXPIRY  = 15 * 60 * 1000L;       // 15 phút
    private static final long REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000L; // 7 ngày

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }


    // ── Sinh Access Token (15 phút) ───────────────────────────
    public String generateAccessToken(String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .claim("type", "access")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRY))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ── Sinh Refresh Token (7 ngày) ───────────────────────────
    public String generateRefreshToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .claim("type", "refresh")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRY))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractRole(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("role", String.class);
    }

    // Lấy Email từ Token
    public String extractUsername(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public String extractEmail(String token) {
        // Trong Spring Security, Email thường được lưu ở trường "Subject" của Token
        return extractUsername(token); // Gọi lại hàm extractUsername có sẵn của bạn
    }

    public String extractType(String token) {
        return getClaims(token).get("type", String.class);
    }

    // Kiểm tra Token có hợp lệ không
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    //alias cho validateToken
    public boolean isTokenValid(String token) {
        return validateToken(token);
    }

    // kiểm tra loại token
    public boolean isAccessToken(String token) {
        try {
            String type = extractType(token);
            return type == null || "access".equals(type);
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isRefreshToken(String token) {
        try { return "refresh".equals(extractType(token)); }
        catch (Exception e) { return false; }
    }

    // ── Helper dùng chung
    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

}

