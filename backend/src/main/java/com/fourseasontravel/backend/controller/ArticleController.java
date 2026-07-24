package com.fourseasontravel.backend.controller;

import com.fourseasontravel.backend.dto.ArticleResponseDTO;
import com.fourseasontravel.backend.model.Article;
import com.fourseasontravel.backend.service.ArticleService;
import com.fourseasontravel.backend.service.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Tag(name = "Articles", description = "Quản lý Bài viết & Cẩm nang du lịch (Đăng bài, kiểm duyệt, dọn dẹp bản nháp)")
@RestController
@RequestMapping("/api/v1/articles")
public class ArticleController {

    @Autowired
    private ArticleService articleService;

    @Autowired
    private SearchService searchService;


    @Operation(summary = "Lấy tất cả bài viết đang hiển thị", description = "Trả về danh sách các bài viết / cẩm nang du lịch đã được phê duyệt và đang công khai trên hệ thống.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công")
    })
    @GetMapping
    public ResponseEntity<List<ArticleResponseDTO>> getAll() {
        List<ArticleResponseDTO> articles = articleService.getAllArticles().stream()
                .map(ArticleResponseDTO::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(articles);
    }


    @Operation(summary = "Lấy chi tiết bài viết theo ID", description = "Tìm kiếm và trả về nội dung chi tiết của một cẩm nang du lịch cụ thể bằng ID.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tìm thấy thông tin chi tiết bài viết"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy bài viết với ID đã cung cấp")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ArticleResponseDTO> getById(@PathVariable String id) {
        return articleService.getArticleById(id)
                .map(article -> ResponseEntity.ok(ArticleResponseDTO.from(article)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }


    @Operation(summary = "Lấy danh sách bài viết của chính tôi", description = "Trả về danh sách tất cả các bài viết do tài khoản tác giả (Author/Admin) đang đăng nhập tạo ra.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa đăng nhập / Token không hợp lệ")
    })
    @GetMapping("/my-articles")
    public ResponseEntity<List<ArticleResponseDTO>> getMyArticles() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<ArticleResponseDTO> articles = articleService.getArticlesByAuthor(email).stream()
                .map(ArticleResponseDTO::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(articles);
    }


    @Operation(summary = "Lấy danh sách bài viết chờ duyệt", description = "Dành riêng cho Admin để lấy danh sách toàn bộ các bài viết mới đang đợi phê duyệt.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "403", description = "Chỉ Admin mới có quyền truy cập")
    })
    @GetMapping("/pending")
    public ResponseEntity<List<ArticleResponseDTO>> getPendingArticles() {
        List<ArticleResponseDTO> articles = articleService.getPendingArticles().stream()
                .map(ArticleResponseDTO::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(articles);
    }


    @Operation(summary = "Tạo bài viết mới", description = "Cho phép Author hoặc Admin tạo một bài viết/cẩm nang mới. Trạng thái ban đầu sẽ là chờ duyệt (isApproved = false).")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Tạo bài viết thành công và chờ phê duyệt"),
            @ApiResponse(responseCode = "401", description = "Chưa đăng nhập / Token không hợp lệ"),
            @ApiResponse(responseCode = "403", description = "Không có quyền thực hiện hành động này")
    })
    @PostMapping
    public ResponseEntity<ArticleResponseDTO> create(@RequestBody Article article) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Article createdArticle = articleService.createArticle(article, email);
        return new ResponseEntity<>(ArticleResponseDTO.from(createdArticle), HttpStatus.CREATED);
    }


    @Operation(summary = "Lấy bài viết đã duyệt", description = "Nhận về danh sách cẩm nang du lịch đã được duyệt để hiển thị ngoài giao diện chính.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công")
    })
    @GetMapping("/approved")
    public ResponseEntity<List<ArticleResponseDTO>> getApprovedArticles() {
        List<ArticleResponseDTO> articles = articleService.getApprovedArticles().stream()
                .map(ArticleResponseDTO::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(articles);
    }


    @Operation(summary = "Phê duyệt cho phép bài viết công khai", description = "Admin phê duyệt bài viết của tác giả để chính thức phát hành công khai trên hệ thống.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Duyệt bài đăng thành công"),
            @ApiResponse(responseCode = "400", description = "Lỗi khi xử lý phê duyệt")
    })
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveArticle(@PathVariable String id) {
        try {
            Article approvedArticle = articleService.approveArticle(id);
            return ResponseEntity.ok(ArticleResponseDTO.from(approvedArticle));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectArticle(@PathVariable String id) {
        try {
            Article rejectedArticle = articleService.rejectArticle(id);
            return ResponseEntity.ok(ArticleResponseDTO.from(rejectedArticle));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ArticleResponseDTO> update(@PathVariable String id, @RequestBody Article article) {
        Article updated = articleService.updateArticle(id, article);
        return updated != null ? ResponseEntity.ok(ArticleResponseDTO.from(updated)) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        articleService.deleteArticle(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/author-delete")
    public ResponseEntity<?> authorDeleteArticle(@PathVariable String id) {
        try {
            // Lấy email người đang đăng nhập
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            articleService.authorDeleteArticle(id, email);
            return ResponseEntity.ok("Đã xóa bản nháp thành công!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}