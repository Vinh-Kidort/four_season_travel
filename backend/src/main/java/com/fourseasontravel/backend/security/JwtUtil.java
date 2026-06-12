package com.fourseasontravel.backend.security;

import com.google.api.client.util.Value;
import io.jsonwebtoken.Jwts;
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
    private final long EXPIRATION_TIME = 86400000 * 3;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    // Hàm tạo Token khi Đăng nhập thành công
    public String generateToken(String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role) // NHÉT THÊM ROLE VÀO ĐÂY
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
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

    // Kiểm tra Token có hợp lệ không
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String extractEmail(String token) {
        // Trong Spring Security, Email thường được lưu ở trường "Subject" của Token
        return extractUsername(token); // Gọi lại hàm extractUsername có sẵn của bạn
    }
}