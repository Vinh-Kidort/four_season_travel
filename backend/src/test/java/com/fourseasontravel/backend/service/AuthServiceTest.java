package com.fourseasontravel.backend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.fourseasontravel.backend.model.User;
import com.fourseasontravel.backend.repository.UserRepository;
import com.fourseasontravel.backend.security.JwtUtil;

import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

// ... giữ nguyên code test bên dưới

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository        userRepository;
    @Mock private PasswordEncoder       passwordEncoder;
    @Mock private JwtUtil               jwtUtil;
    @Mock private AccountLockoutService lockoutService;
    @Mock private OtpService            otpService;

    @Mock private RefreshTokenService   refreshTokenService;

    @InjectMocks private AuthService authService;

    @Test
    @DisplayName("Đăng nhập thành công")
    void login_Success() {
        User user = new User();
        user.setEmail("test@test.com");
        user.setPassword("encoded");
        user.setRole("USER");
        user.setIsLocked(false);

        when(userRepository.findByEmail("test@test.com"))
                .thenReturn(Optional.of(user));
        when(lockoutService.checkLocked(user)).thenReturn(null);
        when(passwordEncoder.matches("password", "encoded"))
                .thenReturn(true);

        assertDoesNotThrow(() ->
                authService.login("test@test.com", "password", "Mozilla", "127.0.0.1"));
    }

    @Test
    @DisplayName("Tài khoản bị khóa → throw exception")
    void login_AccountLocked() {
        User user = new User();
        user.setEmail("test@test.com");
        user.setIsLocked(true);

        when(userRepository.findByEmail("test@test.com"))
                .thenReturn(Optional.of(user));
        when(lockoutService.checkLocked(user))
                .thenReturn("Tài khoản bị khóa 5 phút");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> authService.login("test@test.com", "pass", "", ""));

        assertTrue(ex.getMessage().contains("khóa"));
    }

    @Test
    @DisplayName("Validate password — thiếu ký tự đặc biệt")
    void validatePassword_MissingSpecialChar() {
        User user = new User();
        user.setEmail("new@test.com");

        when(userRepository.findByEmail("new@test.com"))
                .thenReturn(Optional.empty());

        // Password không có ký tự đặc biệt
        assertThrows(RuntimeException.class,
                () -> authService.sendRegisterOtp(
                        "Test", "new@test.com", "Password123"));
    }
}