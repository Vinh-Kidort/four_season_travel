package com.fourseasontravel.backend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String name;
    private String email;
    private String password; // Mật khẩu sẽ được mã hóa
    private Boolean mustChangePassword = false;
    private String role;     // "USER" hoặc "ADMIN"
    private String dob;    // Ngày sinh (Date of birth)
    private String gender; // Giới tính
    private String phone;
    private Integer     failedLoginAttempts = 0;  // Số lần sai mật khẩu
    private Boolean isLocked            = false; // Tài khoản bị khóa
    private LocalDateTime lockedUntil         = null; // Khóa đến khi nào
    private LocalDate     lastFailDate        = null; // Ngày sai gần nhất
    private String status = "active"; // "active" | "deleted"
}