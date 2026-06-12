package com.fourseasontravel.backend.controller;

import com.fourseasontravel.backend.model.User;
import com.fourseasontravel.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.fourseasontravel.backend.service.ArticleService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserService userService;

    // INJECT ARTICLE SERVICE VÀO ĐÂY
    @Autowired
    private ArticleService articleService;


    // Hàm phụ: Lấy email của người đang đăng nhập từ Token
    private String getLoggedInEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    // 1. API LẤY THÔNG TIN TÀI KHOẢN (GET /api/v1/users/me)
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser() {
        String email = getLoggedInEmail();
        Optional<User> user = userService.getUserByEmail(email);

        if (user.isPresent()) {
            User safeUser = user.get();
            safeUser.setPassword(null); // Giấu mật khẩu đi, không gửi về ReactJS
            return ResponseEntity.ok(safeUser);
        }
        return ResponseEntity.notFound().build();
    }

    // 2. API CẬP NHẬT THÔNG TIN (PUT /api/v1/users/me)
    @PutMapping("/me")
    public ResponseEntity<User> updateCurrentUser(@RequestBody User updateData) {
        String email = getLoggedInEmail();
        User updatedUser = userService.updateUser(email, updateData);

        if (updatedUser != null) {
            if (updateData.getName() != null && !updateData.getName().trim().isEmpty()) {
                articleService.updateAuthorNameInArticles(email, updateData.getName());
            }

            updatedUser.setPassword(null); // Giấu mật khẩu
            return ResponseEntity.ok(updatedUser);
        }
        return ResponseEntity.notFound().build();
    }

    // Lấy danh sách tất cả tài khoản
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        // Giấu mật khẩu trước khi gửi về React
        users.forEach(user -> user.setPassword(null));
        return ResponseEntity.ok(users);
    }

    // Nâng cấp tài khoản lên AUTHOR
    @PutMapping("/{id}/upgrade")
    public ResponseEntity<?> upgradeToAuthor(@PathVariable String id) {
        User user = userService.upgradeToAuthor(id);
        if (user != null) {
            return ResponseEntity.ok("Đã nâng cấp lên Author thành công!");
        }
        return ResponseEntity.notFound().build();
    }

    // Xóa tài khoản
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("Đã xóa tài khoản!" + id);
    }
    
}