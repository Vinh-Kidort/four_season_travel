package com.fourseasontravel.backend.controller;

import com.fourseasontravel.backend.model.Article;
import com.fourseasontravel.backend.service.ArticleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import org.springframework.security.core.context.SecurityContextHolder;
@RestController
@RequestMapping("/api/v1/articles")
public class ArticleController {

    @Autowired
    private ArticleService articleService;

    @GetMapping
    public ResponseEntity<List<Article>> getAll() {
        return ResponseEntity.ok(articleService.getAllArticles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Article> getById(@PathVariable String id) {
        Optional<Article> article = articleService.getArticleById(id);
        return article.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/my-articles")
    public ResponseEntity<List<Article>> getMyArticles() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(articleService.getArticlesByAuthor(email));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Article>> getPendingArticles() {
        return ResponseEntity.ok(articleService.getPendingArticles());
    }

    @PostMapping
    public ResponseEntity<Article> create(@RequestBody Article article) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return new ResponseEntity<>(articleService.createArticle(article, email), HttpStatus.CREATED);
    }

    @GetMapping("/approved")
    public ResponseEntity<List<Article>> getApprovedArticles() {
        return ResponseEntity.ok(articleService.getApprovedArticles());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveArticle(@PathVariable String id) {
        try {
            return ResponseEntity.ok(articleService.approveArticle(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectArticle(@PathVariable String id) {
        try {
            return ResponseEntity.ok(articleService.rejectArticle(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Article> update(@PathVariable String id, @RequestBody Article article) {
        Article updated = articleService.updateArticle(id, article);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
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