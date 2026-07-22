package com.fourseasontravel.backend.service;

import com.fourseasontravel.backend.model.RefreshToken;
import com.fourseasontravel.backend.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class RefreshTokenService {

    @Autowired private RefreshTokenRepository refreshTokenRepository;

    // ── Lưu refresh token vào DB ──────────────────────────────
    public void saveRefreshToken(String token, String email,
                                 String userAgent, String ip) {
        // Xóa token cũ của thiết bị này (optional — giới hạn session)
        // refreshTokenRepository.deleteByEmail(email);

        RefreshToken rt = RefreshToken.builder()
                .token(token)
                .email(email)
                .userAgent(userAgent)
                .ipAddress(ip)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();

        refreshTokenRepository.save(rt);
    }

    // ── Xác thực refresh token ────────────────────────────────
    public RefreshToken validateRefreshToken(String token) {
        RefreshToken rt = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Refresh token không hợp lệ!"));

        if (rt.isRevoked())
            throw new RuntimeException("Refresh token đã bị thu hồi!");

        if (rt.getExpiresAt().isBefore(LocalDateTime.now())) {
            // Xóa token hết hạn
            refreshTokenRepository.delete(rt);
            throw new RuntimeException("Refresh token đã hết hạn! Vui lòng đăng nhập lại.");
        }

        return rt;
    }

    // ── Revoke refresh token (logout) ─────────────────────────
    public void revokeToken(String token) {
        refreshTokenRepository.findByToken(token).ifPresent(rt -> {
            rt.setRevoked(true);
            refreshTokenRepository.save(rt);
        });
    }

    // ── Revoke tất cả token của user (logout all devices) ─────
    public void revokeAllTokens(String email) {
        refreshTokenRepository.findByEmail(email).forEach(rt -> {
            rt.setRevoked(true);
            refreshTokenRepository.save(rt);
        });
    }
}