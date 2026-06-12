package com.fourseasontravel.backend.controller;
import com.fourseasontravel.backend.model.User;
import com.fourseasontravel.backend.security.JwtUtil;
import com.fourseasontravel.backend.service.AuthService;
import com.fourseasontravel.backend.service.RecaptchaService;
import com.fourseasontravel.backend.service.UserDeletionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;


@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private RecaptchaService recaptchaService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDeletionService userDeletionService;

    // ── BƯỚC 1: Gửi OTP ──────────────────────────────────────────
    @PostMapping("/register/send-otp")
    public ResponseEntity<?> sendRegisterOtp(@RequestBody Map<String, String> body) {
        // Verify reCAPTCHA
        if (!recaptchaService.verify(body.get("captchaToken"))) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Xác thực reCAPTCHA thất bại!"));
        }
        try {
            authService.sendRegisterOtp(
                    body.get("name"),
                    body.get("email"),
                    body.get("password")
            );
            return ResponseEntity.ok(Map.of(
                    "message", "Mã OTP đã được gửi đến " + body.get("email"),
                    "email",   body.get("email")
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── BƯỚC 2: Xác thực OTP + hoàn tất đăng ký ─────────────────
    @PostMapping("/register/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        try {
            Map<String, String> response = authService.verifyAndRegister(
                    body.get("name"),
                    body.get("email"),
                    body.get("password"),
                    body.get("otp")
            );
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    // ── 2. ĐĂNG NHẬP (Có xác thực reCAPTCHA) ──────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        // Kiểm tra reCAPTCHA
        String captchaToken = body.get("captchaToken");
        if (!recaptchaService.verify(captchaToken)) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Xác thực Robot thất bại. Vui lòng tải lại trang!")
            );
        }
        try {
            // Gọi AuthService (Hàm này đã tự động tạo và trả về Map chứa Token, Role, Email, Name)
            Map<String, String> response = authService.login(body.get("email"), body.get("password"));
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            // Lỗi sai mật khẩu, tài khoản bị khóa -> Trả về 401 Unauthorized
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Đổi mật khẩu ─────────────────────────────────────────────
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String email = jwtUtil.extractUsername(token); // Dùng extractUsername như đã thống nhất ở bước trước

            // GỌI SERVICE: Không truyền forceChange từ Frontend vào nữa
            authService.changePassword(
                    email,
                    body.get("oldPassword"),
                    body.get("oldPasswordConfirm"),
                    body.get("newPassword")
            );

            return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Quên mật khẩu ────────────────────────────────────────────
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        try {
            authService.forgotPassword(body.get("email"));
            return ResponseEntity.ok(Map.of(
                    "message", "Mật khẩu tạm thời đã được gửi đến email của bạn!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Kiểm tra có cần đổi mật khẩu không ──────────────────────
    @GetMapping("/must-change-password")
    public ResponseEntity<?> mustChangePassword(
            @RequestHeader("Authorization") String authHeader) {
        try {
            boolean mustChange = authService.checkMustChangePasswordFromToken(authHeader);
            return ResponseEntity.ok(Map.of("mustChange", mustChange));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── 3. ĐĂNG NHẬP GOOGLE ───────────────────────────────────────
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body) {
        try {
            String googleToken = body.get("token");

            // Hàm loginWithGoogle trong AuthService cũng đã trả về sẵn Map thông tin
            Map<String, String> response = authService.loginWithGoogle(googleToken);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/delete-account")
    public ResponseEntity<?> deleteAccount(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            // ĐÃ SỬA LỖI Ở ĐÂY: Đổi extractEmail thành extractUsername
            String email = jwtUtil.extractUsername(token);

            userDeletionService.deleteAccount(email);
            return ResponseEntity.ok(Map.of(
                    "message", "Tài khoản đã được xóa thành công."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage()));
        }
    }
}