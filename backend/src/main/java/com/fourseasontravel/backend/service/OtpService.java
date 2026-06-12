package com.fourseasontravel.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
public class OtpService {

    @Autowired
    private CacheManager  cacheManager;
    @Autowired
    private EmailService  emailService;

    private static final String CACHE_NAME   = "otpCache";
    private static final int    OTP_LENGTH   = 6;
    private static final int    MAX_ATTEMPTS = 5; // Tối đa 5 lần nhập sai OTP

    // ── Tạo OTP ngẫu nhiên 6 chữ số ─────────────────────────────
    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    // ── Gửi OTP đến email ────────────────────────────────────────
    public void sendOtp(String email, String name) {
        String otp = generateOtp();

        // Lưu OTP vào cache với key = email
        // Format: "otp:attempts" — lưu cả số lần thử
        Cache cache = cacheManager.getCache(CACHE_NAME);
        if (cache != null) {
            cache.put(email, otp + ":0"); // otp:attemptCount
        }

        // Gửi email chứa OTP
        emailService.sendOtpEmail(email, name, otp);
    }

    // ── Xác thực OTP ─────────────────────────────────────────────
    public OtpResult verifyOtp(String email, String inputOtp) {
        Cache cache = cacheManager.getCache(CACHE_NAME);
        if (cache == null) return OtpResult.EXPIRED;

        Cache.ValueWrapper wrapper = cache.get(email);
        if (wrapper == null) return OtpResult.EXPIRED;

        String[] parts    = wrapper.get().toString().split(":");
        String   storedOtp = parts[0];
        int      attempts  = Integer.parseInt(parts[1]);

        // Quá số lần thử
        if (attempts >= MAX_ATTEMPTS) {
            cache.evict(email);
            return OtpResult.TOO_MANY_ATTEMPTS;
        }

        if (!storedOtp.equals(inputOtp.trim())) {
            // Tăng số lần thử
            cache.put(email, storedOtp + ":" + (attempts + 1));
            return OtpResult.INVALID;
        }

        // Đúng OTP → xóa khỏi cache
        cache.evict(email);
        return OtpResult.SUCCESS;
    }

    // ── Kiểm tra OTP còn hiệu lực không ─────────────────────────
    public boolean hasValidOtp(String email) {
        Cache cache = cacheManager.getCache(CACHE_NAME);
        if (cache == null) return false;
        return cache.get(email) != null;
    }

    public enum OtpResult {
        SUCCESS, INVALID, EXPIRED, TOO_MANY_ATTEMPTS
    }
}