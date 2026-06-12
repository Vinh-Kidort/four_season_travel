package com.fourseasontravel.backend.service;

import com.fourseasontravel.backend.model.User;
import com.fourseasontravel.backend.repository.UserRepository;
import com.fourseasontravel.backend.security.JwtUtil;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AccountLockoutService lockoutService;

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;


    @Value("${google.client-id}")
    private String googleClientId;
    // ── BƯỚC 1: Validate + gửi OTP (chưa lưu DB) ────────────────
    public void sendRegisterOtp(String name, String email, String password) {
        // Kiểm tra email tồn tại
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email này đã được sử dụng!");
        }

        // Validate mật khẩu
        validatePassword(password);

        // Gửi OTP
        otpService.sendOtp(email, name);
    }

    // ── BƯỚC 2: Xác thực OTP + lưu user vào DB ──────────────────
    public Map<String, String> verifyAndRegister(String name, String email,
                                                 String password, String otp) {
        // Verify OTP
        OtpService.OtpResult result = otpService.verifyOtp(email, otp);

        switch (result) {
            case EXPIRED -> throw new RuntimeException(
                    "Mã OTP đã hết hạn! Vui lòng đăng ký lại.");
            case INVALID -> throw new RuntimeException(
                    "Mã OTP không đúng! Vui lòng kiểm tra lại.");
            case TOO_MANY_ATTEMPTS -> throw new RuntimeException(
                    "Nhập sai OTP quá nhiều lần! Vui lòng đăng ký lại.");
            case SUCCESS -> {
            } // Tiếp tục
        }

        // Kiểm tra lại email (tránh race condition)
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email này đã được sử dụng!");
        }

        // Lưu user
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("USER");
        user.setFailedLoginAttempts(0);
        user.setIsLocked(false);
        user.setLockedUntil(null);
        user.setLastFailDate(null);

        userRepository.save(user);

        // Tự động login và trả về token
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return createAuthResponse(user, token);
    }

    // ── Validate mật khẩu ────────────────────────────────────────
    private void validatePassword(String password) {
        if (password == null || password.length() < 8) {
            throw new RuntimeException(
                    "Mật khẩu phải có ít nhất 8 ký tự!");
        }
        if (!password.matches(".*[a-zA-Z].*")) {
            throw new RuntimeException(
                    "Mật khẩu phải chứa ít nhất 1 chữ cái!");
        }
        if (!password.matches(".*[0-9].*")) {
            throw new RuntimeException(
                    "Mật khẩu phải chứa ít nhất 1 chữ số!");
        }
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
            throw new RuntimeException(
                    "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%...)!");
        }
    }

    // ── 2. ĐĂNG NHẬP BẰNG MẬT KHẨU (Có chống Spam) ───────────────
    // ĐÃ ĐỔI KIỂU TRẢ VỀ THÀNH Map<String, String>
    public Map<String, String> login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại!"));

        // CHECK TÀI KHOẢN BỊ XÓA
        if ("deleted".equals(user.getStatus())) {
            throw new RuntimeException(
                    "Tài khoản này đã bị xóa!");
        }

        // Bước 1: Kiểm tra khóa tài khoản
        String lockMsg = lockoutService.checkLocked(user);
        if (lockMsg != null) {
            throw new RuntimeException(lockMsg);
        }

        // Bước 2: Kiểm tra mật khẩu
        if (!passwordEncoder.matches(password, user.getPassword())) {
            lockoutService.onLoginFailure(user);
            int remaining = 5 - (user.getFailedLoginAttempts() % 5);
            if (remaining > 0 && user.getFailedLoginAttempts() < 5) {
                throw new RuntimeException(
                        "Mật khẩu không đúng! Còn " + remaining + " lần thử trước khi tài khoản bị khóa."
                );
            }
            throw new RuntimeException("Mật khẩu không đúng! Tài khoản đã bị khóa tạm thời.");
        }

        // Bước 3: Thành công -> Xóa lịch sử nhập sai
        lockoutService.onLoginSuccess(user);

        // Tạo Token và trả về Map
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return createAuthResponse(user, token);
    }

    // ── 3. ĐĂNG NHẬP BẰNG GOOGLE ─────────────────────────────────
    // ĐÃ ĐỔI KIỂU TRẢ VỀ THÀNH Map<String, String>
    public Map<String, String> loginWithGoogle(String googleToken) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(googleToken);
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();
                String email = payload.getEmail();
                String name = (String) payload.get("name");

                Optional<User> userOptional = userRepository.findByEmail(email);
                User user;

                if (userOptional.isPresent()) {
                    user = userOptional.get();

                    if ("deleted".equals(user.getStatus())) {
                        throw new RuntimeException("Tài khoản này đã bị xóa hoặc ngưng hoạt động!");
                    }

                    lockoutService.onLoginSuccess(user); // Reset số lần sai
                } else {
                    user = new User();
                    user.setEmail(email);
                    user.setName(name);
                    user.setRole("USER");
                    user.setStatus("active");
                    user.setPassword(""); // Không cần mật khẩu
                    userRepository.save(user);
                }

                String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
                return createAuthResponse(user, token);
            } else {
                throw new RuntimeException("Google Token không hợp lệ!");
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi xác thực Google: " + e.getMessage());
        }
    }

    // ── HÀM HỖ TRỢ ĐÓNG GÓI DỮ LIỆU TRẢ VỀ FRONTEND ──────────────
    private Map<String, String> createAuthResponse(User user, String token) {
        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        response.put("role", user.getRole());
        response.put("email", user.getEmail());
        response.put("name", user.getName());
        return response;
    }


    // ── ĐỔI MẬT KHẨU ─────────────────────────────────────────────
    public void changePassword(String email, String oldPassword,
                               String oldPasswordConfirm, String newPassword) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản!"));

        // 1. Chặn tài khoản Google
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            throw new RuntimeException("Tài khoản của bạn được liên kết với Google nên không sử dụng mật khẩu. Không thể đổi mật khẩu!");
        }

        // 2. TỰ ĐỘNG LẤY TRẠNG THÁI FORCE CHANGE TỪ DATABASE (Chuẩn bảo mật)
        boolean forceChange = Boolean.TRUE.equals(user.getMustChangePassword());

        // 3. Nếu KHÔNG phải force change → kiểm tra mật khẩu cũ
        if (!forceChange) {
            if (oldPassword == null || !oldPassword.equals(oldPasswordConfirm)) {
                throw new RuntimeException("Mật khẩu cũ không khớp!");
            }
            if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
                throw new RuntimeException("Mật khẩu cũ không đúng!");
            }
            if (passwordEncoder.matches(newPassword, user.getPassword())) {
                throw new RuntimeException("Mật khẩu mới không được trùng mật khẩu cũ!");
            }
        }

        // 4. Validate mật khẩu mới (Áp dụng cho cả 2 trường hợp)
        validatePassword(newPassword);

        // 5. Lưu mật khẩu mới và Reset cờ
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false); // ← Reset flag
        userRepository.save(user);
    }

    public void changePasswordFromToken(String authHeader, String oldPassword, String oldPasswordConfirm, String newPassword) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.extractEmail(token);
        changePassword(email, oldPassword, oldPasswordConfirm, newPassword);
    }

    // ── QUÊN MẬT KHẨU — gửi mật khẩu tạm về email ───────────────
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException(
                        "Email không tồn tại trong hệ thống!"));

        // Sinh mật khẩu tạm ngẫu nhiên
        String tempPassword = generateTempPassword();

        // Lưu mật khẩu tạm + đánh dấu buộc đổi mật khẩu
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setMustChangePassword(true); // ← Buộc đổi khi login
        user.setFailedLoginAttempts(0);
        user.setIsLocked(false);
        userRepository.save(user);

        // Gửi email
        emailService.sendTempPasswordEmail(email, user.getName(), tempPassword);
    }

    // ── Sinh mật khẩu tạm 10 ký tự ───────────────────────────────
    private String generateTempPassword() {
        String upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
        String lower = "abcdefghjkmnpqrstuvwxyz";
        String numbers = "23456789"; // Đã bỏ 0 và 1 để tránh người dùng nhìn nhầm thành O và l
        String specials = "!@#$";
        String all = upper + lower + numbers + specials;

        SecureRandom random = new SecureRandom();
        java.util.List<Character> pwdChars = new java.util.ArrayList<>();

        // 1. Bắt buộc chắc chắn có ít nhất 1 ký tự mỗi loại
        pwdChars.add(upper.charAt(random.nextInt(upper.length())));
        pwdChars.add(lower.charAt(random.nextInt(lower.length())));
        pwdChars.add(numbers.charAt(random.nextInt(numbers.length())));
        pwdChars.add(specials.charAt(random.nextInt(specials.length())));

        // 2. 6 ký tự còn lại bốc ngẫu nhiên từ tất cả
        for (int i = 0; i < 6; i++) {
            pwdChars.add(all.charAt(random.nextInt(all.length())));
        }

        // 3. Xáo trộn ngẫu nhiên vị trí các ký tự
        java.util.Collections.shuffle(pwdChars, random);

        // 4. Ghép mảng thành chuỗi mật khẩu
        StringBuilder sb = new StringBuilder();
        for (char c : pwdChars) {
            sb.append(c);
        }

        return sb.toString();
    }

    // ── KIỂM TRA CÓ CẦN ĐỔI MẬT KHẨU KHÔNG ───────────────────
    public boolean mustChangePassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản!"));
        return Boolean.TRUE.equals(user.getMustChangePassword());
    }

    public boolean checkMustChangePasswordFromToken(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.extractEmail(token);
        return mustChangePassword(email);
    }
}