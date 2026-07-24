package com.fourseasontravel.backend.exception;

import com.fourseasontravel.backend.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── 400 — Lỗi nghiệp vụ ──────────────────────────────────
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntime(
            RuntimeException ex, HttpServletRequest request) {

        return ResponseEntity.badRequest().body(new ErrorResponse(
                400,
                "BAD_REQUEST",
                ex.getMessage(),
                LocalDateTime.now().toString(),
                request.getRequestURI()
        ));
    }

    // ── 401 — Chưa xác thực ──────────────────────────────────
    @ExceptionHandler(org.springframework.security.core
            .AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(
            HttpServletRequest request) {

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse(
                        401,
                        "UNAUTHORIZED",
                        "Vui lòng đăng nhập để tiếp tục!",
                        LocalDateTime.now().toString(),
                        request.getRequestURI()
                ));
    }

    // ── 403 — Không có quyền ─────────────────────────────────
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            HttpServletRequest request) {

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse(
                        403,
                        "FORBIDDEN",
                        "Bạn không có quyền thực hiện hành động này!",
                        LocalDateTime.now().toString(),
                        request.getRequestURI()
                ));
    }

    // ── 404 — Không tìm thấy ─────────────────────────────────
    @ExceptionHandler(java.util.NoSuchElementException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            HttpServletRequest request) {

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(
                        404,
                        "NOT_FOUND",
                        "Không tìm thấy dữ liệu yêu cầu!",
                        LocalDateTime.now().toString(),
                        request.getRequestURI()
                ));
    }

    // ── 413 — File quá lớn ───────────────────────────────────
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleFileTooLarge(
            HttpServletRequest request) {

        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new ErrorResponse(
                        413,
                        "FILE_TOO_LARGE",
                        "File upload quá lớn! Vui lòng chọn file nhỏ hơn.",
                        LocalDateTime.now().toString(),
                        request.getRequestURI()
                ));
    }

    // ── 429 — Rate limit ─────────────────────────────────────
    @ExceptionHandler(RateLimitException.class)
    public ResponseEntity<ErrorResponse> handleRateLimit(
            HttpServletRequest request) {

        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(new ErrorResponse(
                        429,
                        "TOO_MANY_REQUESTS",
                        "Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau!",
                        LocalDateTime.now().toString(),
                        request.getRequestURI()
                ));
    }

    // ── 500 — Lỗi hệ thống ───────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(
            Exception ex, HttpServletRequest request) {

        // Log lỗi để debug
        System.err.println("❌ Unhandled error: " + ex.getMessage());
        ex.printStackTrace();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(
                        500,
                        "INTERNAL_SERVER_ERROR",
                        "Lỗi hệ thống! Vui lòng thử lại sau.",
                        LocalDateTime.now().toString(),
                        request.getRequestURI()
                ));
    }
}