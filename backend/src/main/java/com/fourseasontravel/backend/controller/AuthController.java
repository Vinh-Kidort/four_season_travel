package com.fourseasontravel.backend.controller;

import com.fourseasontravel.backend.model.User;
import com.fourseasontravel.backend.repository.UserRepository;
import com.fourseasontravel.backend.security.JwtUtil;
import com.fourseasontravel.backend.service.AuthService;
import com.fourseasontravel.backend.service.RecaptchaService;
import com.fourseasontravel.backend.service.RefreshTokenService;
import com.fourseasontravel.backend.service.UserDeletionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Map;

@Tag(name = "Authentication", description = "Quản lý Đăng nhập, Đăng ký, OTP, Đổi/Quên mật khẩu và Xóa tài khoản")
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

    @Autowired
    private RefreshTokenService  refreshTokenService;

    @Autowired
    private UserRepository       userRepository;

    @Operation(summary = "Gửi mã OTP đăng ký tài khoản", description = "Xác thực reCAPTCHA và gửi mã OTP xác nhận về hòm thư email của khách hàng đăng ký mới.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Gửi mã OTP thành công"),
            @ApiResponse(responseCode = "400", description = "Xác thực reCAPTCHA thất bại hoặc email đã tồn tại trong hệ thống")
    })
    //  BƯỚC 1: Gửi OTP
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


    @Operation(summary = "Xác thực OTP và hoàn tất đăng ký", description = "Nhập mã OTP được gửi về email. Nếu mã khớp và chưa hết hạn, hệ thống tự động lưu tài khoản vào cơ sở dữ liệu và tự động trả về Token.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Đăng ký thành công và tự động đăng nhập"),
            @ApiResponse(responseCode = "400", description = "Mã OTP không đúng, hết hạn hoặc nhập sai vượt quá số lần cho phép")
    })
    //  BƯỚC 2: Xác thực OTP + hoàn tất đăng ký
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


    @Operation(summary = "Đăng nhập tài khoản bằng mật khẩu", description = "Xác thực thông tin tài khoản (email/mật khẩu) và kiểm tra reCAPTCHA chống spam.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Đăng nhập thành công và trả về JWT Token cùng thông tin cá nhân"),
            @ApiResponse(responseCode = "400", description = "Xác thực Robot (reCAPTCHA) thất bại"),
            @ApiResponse(responseCode = "401", description = "Mật khẩu không đúng hoặc tài khoản đã bị khóa tạm thời do nhập sai nhiều lần")
    })
    //  2. ĐĂNG NHẬP (Có xác thực reCAPTCHA)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body,
                                   HttpServletRequest  request,
                                   HttpServletResponse response) {
        String captchaToken = body.get("captchaToken");
        if (!recaptchaService.verify(body.get("captchaToken"))) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Xác thực reCAPTCHA thất bại!"));
        }
        try {
            String userAgent = request.getHeader("User-Agent");
            String ip        = request.getRemoteAddr();

            Map<String, Object> result = authService.login(
                    body.get("email"), body.get("password"), userAgent, ip);

            // Set refresh token vào HttpOnly Cookie
            setRefreshTokenCookie(response, (String) result.get("refreshToken"));
            result.remove("refreshToken"); // Không trả về body

            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    // ── THÊM MỚI: Refresh Access Token ───────────────────────────
    @Operation(summary = "Làm mới Access Token bằng Refresh Token (Cookie)")
    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(HttpServletRequest  request,
                                          HttpServletResponse response) {
        try {
            String refreshToken = getRefreshTokenFromCookie(request);
            if (refreshToken == null)
                return ResponseEntity.status(401)
                        .body(Map.of("error", "Không tìm thấy refresh token!"));

            // Validate trong DB
            refreshTokenService.validateRefreshToken(refreshToken);

            // Validate JWT
            if (!jwtUtil.isTokenValid(refreshToken) || !jwtUtil.isRefreshToken(refreshToken))
                return ResponseEntity.status(401)
                        .body(Map.of("error", "Refresh token không hợp lệ!"));

            String email = jwtUtil.extractEmail(refreshToken);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User không tồn tại!"));

            // Sinh access token mới
            String newAccessToken  = jwtUtil.generateAccessToken(email, user.getRole());

            // Rotate refresh token
            String newRefreshToken = jwtUtil.generateRefreshToken(email);
            refreshTokenService.revokeToken(refreshToken);
            refreshTokenService.saveRefreshToken(
                    newRefreshToken, email,
                    request.getHeader("User-Agent"),
                    request.getRemoteAddr());
            setRefreshTokenCookie(response, newRefreshToken);

            return ResponseEntity.ok(Map.of(
                    "accessToken", newAccessToken,
                    "token",       newAccessToken, // backward compat
                    "email",       email,
                    "role",        user.getRole(),
                    "name",        user.getName()
            ));
        } catch (RuntimeException e) {
            clearRefreshTokenCookie(response);
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    // ── THÊM MỚI: Logout ─────────────────────────────────────────
    @Operation(summary = "Đăng xuất — thu hồi Refresh Token")
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest  request,
                                    HttpServletResponse response) {
        String refreshToken = getRefreshTokenFromCookie(request);
        if (refreshToken != null)
            refreshTokenService.revokeToken(refreshToken);
        clearRefreshTokenCookie(response);
        return ResponseEntity.ok(Map.of("message", "Đăng xuất thành công!"));
    }

    // ── THÊM MỚI: Logout tất cả thiết bị ────────────────────────
    @Operation(summary = "Đăng xuất khỏi tất cả thiết bị")
    @PostMapping("/logout-all")
    public ResponseEntity<?> logoutAll(HttpServletRequest  request,
                                       HttpServletResponse response,
                                       @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String email = jwtUtil.extractEmail(token);
            refreshTokenService.revokeAllTokens(email);
            clearRefreshTokenCookie(response);
            return ResponseEntity.ok(Map.of("message", "Đã đăng xuất khỏi tất cả thiết bị!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    @Operation(summary = "Đổi mật khẩu tài khoản", description = "Đổi mật khẩu mới. Nếu tài khoản ở trạng thái 'Bắt buộc đổi mật khẩu' (sau khi quên mật khẩu), hệ thống sẽ tự động bỏ qua bước kiểm tra mật khẩu cũ để bảo mật.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Đổi mật khẩu thành công"),
            @ApiResponse(responseCode = "400", description = "Mật khẩu cũ không khớp hoặc mật khẩu mới không đáp ứng độ an toàn tối thiểu")
    })
    //  Đổi mật khẩu
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


    @Operation(summary = "Quên mật khẩu (Gửi mật khẩu tạm về Email)", description = "Yêu cầu hệ thống tạo mật khẩu tạm thời ngẫu nhiên đạt chuẩn bảo mật và tự động gửi về email đăng ký.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Gửi mật khẩu tạm thời thành công"),
            @ApiResponse(responseCode = "400", description = "Email không tồn tại trong hệ thống")
    })
    //  Quên mật khẩu
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


    @Operation(summary = "Kiểm tra xem tài khoản có bắt buộc đổi mật khẩu hay không", description = "Kiểm tra cờ 'mustChangePassword' của người dùng hiện tại thông qua Token đăng nhập.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy trạng thái thành công"),
            @ApiResponse(responseCode = "400", description = "Lỗi khi kiểm tra Token")
    })
    //  Kiểm tra có cần đổi mật khẩu không
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


    @Operation(summary = "Đăng nhập nhanh bằng tài khoản Google", description = "Sử dụng mã Token đăng nhập bằng Google ID từ Frontend để tự động đăng ký hoặc đăng nhập.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Đăng nhập thành công và trả về Token hệ thống"),
            @ApiResponse(responseCode = "401", description = "Xác thực Token Google thất bại")
    })
    // 3. ĐĂNG NHẬP GOOGLE
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body,
                                         HttpServletRequest  request,
                                         HttpServletResponse response) {
        try {
            String userAgent = request.getHeader("User-Agent");
            String ip        = request.getRemoteAddr();

            Map<String, Object> result = authService.loginWithGoogle(
                    body.get("token"), userAgent, ip);

            setRefreshTokenCookie(response, (String) result.get("refreshToken"));
            result.remove("refreshToken");

            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }


    @Operation(summary = "Yêu cầu xóa tài khoản (Xóa mềm)", description = "Người dùng hiện tại tự gửi yêu cầu hủy/xóa tài khoản của mình. Trạng thái người dùng sẽ chuyển thành 'deleted'.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Yêu cầu xóa tài khoản được phê duyệt và xử lý thành công"),
            @ApiResponse(responseCode = "400", description = "Token không hợp lệ hoặc lỗi trong quá trình xóa mềm")
    })
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

    // ── Helpers: Cookie ───────────────────────────────────────────
    private void setRefreshTokenCookie(HttpServletResponse response, String token) {
        response.addHeader("Set-Cookie", String.format(
                "refreshToken=%s; HttpOnly; Secure; Path=/api/v1/auth/refresh-token; Max-Age=%d; SameSite=Strict",
                token, 7 * 24 * 60 * 60));
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        response.addHeader("Set-Cookie",
                "refreshToken=; HttpOnly; Secure; Path=/api/v1/auth/refresh-token; Max-Age=0; SameSite=Strict");
    }

    private String getRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> "refreshToken".equals(c.getName()))
                .map(jakarta.servlet.http.Cookie::getValue)
                .findFirst().orElse(null);
    }
}