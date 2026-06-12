package com.fourseasontravel.backend.service;

import com.fourseasontravel.backend.model.User;
import com.fourseasontravel.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class AccountLockoutService {

    @Autowired
    private UserRepository userRepository;

    private static final int MAX_ATTEMPTS   = 10;
    // Thời gian khóa theo số lần bị khóa (phút)
    private static final int[] LOCKOUT_DURATIONS = {5, 10, 15, 30, 60};

    /**
     * Gọi khi đăng nhập THÀNH CÔNG — reset counter
     */
    public void onLoginSuccess(User user) {
        user.setFailedLoginAttempts(0);
        user.setIsLocked(false);
        user.setLockedUntil(null);
        user.setLastFailDate(null);
        userRepository.save(user);
    }

    /**
     * Gọi khi đăng nhập THẤT BẠI — tăng counter + khóa nếu cần
     */
    public void onLoginFailure(User user) {
        LocalDate today = LocalDate.now();

        // Reset về 5 phút nếu sang ngày mới
        if (user.getLastFailDate() != null
                && !user.getLastFailDate().equals(today)) {
            user.setFailedLoginAttempts(0);
            // Nếu bị khóa từ hôm qua → reset lockout duration về đầu
        }

        user.setLastFailDate(today);
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);

        // Khóa tài khoản nếu vượt ngưỡng
        if (attempts >= MAX_ATTEMPTS) {
            int lockoutMinutes = getLockoutDuration(attempts);
            user.setIsLocked(true);
            user.setLockedUntil(LocalDateTime.now().plusMinutes(lockoutMinutes));
        }

        userRepository.save(user);
    }

    /**
     * Kiểm tra tài khoản có đang bị khóa không
     * Trả về message lỗi nếu bị khóa, null nếu OK
     */
    public String checkLocked(User user) {
        if (!Boolean.TRUE.equals(user.getIsLocked())) return null;

        LocalDate today = LocalDate.now();

        // Sang ngày mới → reset lockout duration về 5 phút
        if (user.getLastFailDate() != null
                && !user.getLastFailDate().equals(today)) {
            user.setIsLocked(false);
            user.setLockedUntil(null);
            user.setFailedLoginAttempts(0);
            user.setLastFailDate(today);
            userRepository.save(user);
            return null;
        }

        // Kiểm tra đã hết thời gian khóa chưa
        if (user.getLockedUntil() != null
                && LocalDateTime.now().isAfter(user.getLockedUntil())) {
            // Hết thời gian khóa → mở khóa
            user.setIsLocked(false);
            user.setLockedUntil(null);
            user.setFailedLoginAttempts(0);
            userRepository.save(user);
            return null;
        }

        // Vẫn còn bị khóa → tính thời gian còn lại
        long secondsLeft = java.time.Duration.between(
                LocalDateTime.now(), user.getLockedUntil()).getSeconds();
        long minutesLeft = (secondsLeft / 60) + 1;

        return String.format(
                "Tài khoản bị khóa do nhập sai mật khẩu quá nhiều lần. "
                        + "Vui lòng thử lại sau %d phút.", minutesLeft);
    }

    /**
     * Tính thời gian khóa dựa theo số lần thất bại
     * 5 lần → 5 phút, 10 lần → 10 phút, 15+ lần → 15 phút...
     */
    private int getLockoutDuration(int attempts) {
        // Số lần bị khóa = (attempts - MAX_ATTEMPTS) / MAX_ATTEMPTS
        int lockCount = (attempts - MAX_ATTEMPTS) / MAX_ATTEMPTS;
        lockCount = Math.min(lockCount, LOCKOUT_DURATIONS.length - 1);
        return LOCKOUT_DURATIONS[lockCount];
    }
}