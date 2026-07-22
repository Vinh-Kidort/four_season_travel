package com.fourseasontravel.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "refresh_tokens")
public class RefreshToken {

    @Id
    private String id;

    @Indexed(unique = true)
    private String token;

    private String email;
    private String userAgent;  // Thiết bị đăng nhập
    private String ipAddress;

    private LocalDateTime createdAt;

    // TTL index — MongoDB tự xóa sau 7 ngày
    @Indexed(expireAfterSeconds = 604800)
    private LocalDateTime expiresAt;

    private boolean revoked = false;
}