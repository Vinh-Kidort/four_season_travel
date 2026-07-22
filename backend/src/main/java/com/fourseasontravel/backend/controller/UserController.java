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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@Tag(name = "Users", description = "Quản lý Người dùng (Hồ sơ cá nhân, nâng cấp quyền, xóa tài khoản)")
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


    @Operation(summary = "Lấy thông tin tài khoản hiện tại",
            description = "Lấy hồ sơ cá nhân chi tiết của người dùng đang đăng nhập thông qua mã Token JWT gửi kèm ở Header. Mật khẩu sẽ tự động được ẩn đi vì lý do bảo mật.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy thông tin tài khoản thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy tài khoản tương ứng")
    })
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


    @Operation(summary = "Cập nhật thông tin tài khoản cá nhân",
            description = "Cho phép người dùng tự chỉnh sửa thông tin cá nhân (Họ tên, SĐT, ngày sinh, giới tính). Nếu người dùng thay đổi họ tên mới, hệ thống sẽ tự động đồng bộ tên tác giả mới sang tất cả các bài viết cũ của họ.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cập nhật thông tin thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy thông tin tài khoản cần cập nhật")
    })
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


    @Operation(summary = "Lấy danh sách tất cả tài khoản (Admin)",
            description = "Dành riêng cho quản trị viên để xem danh sách toàn bộ người dùng đăng ký trên hệ thống. Tất cả mật khẩu của người dùng đều được ẩn đi trước khi trả về client.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách người dùng thành công"),
            @ApiResponse(responseCode = "403", description = "Không có quyền thực hiện hành động này")
    })
    // Lấy danh sách tất cả tài khoản
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        // Giấu mật khẩu trước khi gửi về React
        users.forEach(user -> user.setPassword(null));
        return ResponseEntity.ok(users);
    }


    @Operation(summary = "Nâng cấp tài khoản lên quyền sáng tạo nội dung - Author (Admin)",
            description = "Dành cho quản trị viên thực hiện phê duyệt nâng cấp một thành viên thường lên nhóm quyền tác giả (Author) để có thể viết bài và đăng ký bán tour.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Nâng cấp quyền thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy tài khoản ứng với ID đã cung cấp")
    })
    // Nâng cấp tài khoản lên AUTHOR
    @PutMapping("/{id}/upgrade")
    public ResponseEntity<?> upgradeToAuthor(@PathVariable String id) {
        User user = userService.upgradeToAuthor(id);
        if (user != null) {
            return ResponseEntity.ok("Đã nâng cấp lên Author thành công!");
        }
        return ResponseEntity.notFound().build();
    }


    @Operation(summary = "Xóa tài khoản người dùng (Admin)",
            description = "Dành cho quản trị viên thực hiện xóa vĩnh viễn tài khoản của một thành viên ra khỏi hệ thống dựa trên ID.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Xóa tài khoản thành công")
    })
    // Xóa tài khoản
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("Đã xóa tài khoản!" + id);
    }
    
}