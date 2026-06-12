package com.fourseasontravel.backend.service;

import com.fourseasontravel.backend.model.Article;
import com.fourseasontravel.backend.repository.ArticleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ArticleService {

    private MeilisearchService meilisearchService;

    @Autowired
    public void setMeilisearchService(
            @Lazy MeilisearchService meilisearchService) {
        this.meilisearchService = meilisearchService;
    }

    @Autowired
    private ArticleRepository articleRepository;


    public List<Article> getAllArticles() {
        return articleRepository.findByIsApprovedTrue();
    }

    // Thêm hàm lấy bài chờ duyệt cho Admin
    public List<Article> getPendingArticles() {
        return articleRepository.findByIsApprovedFalseAndIsRejectedFalse();
    }

    // Thêm hàm duyệt bài
    public Article approveArticle(String id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết!"));
        article.setIsApproved(true);
        article.setIsRejected(false);
        Article saved = articleRepository.save(article);

        if (meilisearchService != null) {
            try {
                meilisearchService.syncArticles();
            } catch (Exception e) {
                System.err.println("⚠️ Meili sync skip: " + e.getMessage());
            }
        }
        return saved;
    }

    public Optional<Article> getArticleById(String id) { return articleRepository.findById(id); }

    public Article createArticle(Article article, String authorEmail) {
        article.setAuthor(authorEmail);
        article.setIsApproved(false);
        article.setIsRejected(false);
        return articleRepository.save(article);
    }

    public Article updateArticle(String id, Article articleDetails) {
        Optional<Article> articleOptional = articleRepository.findById(id);
        if (articleOptional.isPresent()) {
            Article existing = articleOptional.get();
            existing.setTitle(articleDetails.getTitle());
            existing.setContent(articleDetails.getContent());
            existing.setLocationId(articleDetails.getLocationId());
            //existing.setAuthor(articleDetails.getAuthor());

            if(articleDetails.getAuthorName() != null) {
                existing.setAuthorName(articleDetails.getAuthorName());
            }
            existing.setImageUrl(articleDetails.getImageUrl());
            existing.setCreatedAt(articleDetails.getCreatedAt());
            existing.setIsApproved(articleDetails.getIsApproved());
            return articleRepository.save(existing);
        }
        return null;
    }

    public void updateAuthorNameInArticles(String authorEmail, String newAuthorName) {
        // Tìm tất cả bài viết của Email này
        List<Article> articles = articleRepository.findByAuthor(authorEmail);

        // Cập nhật tên mới cho tất cả
        for (Article article : articles) {
            article.setAuthorName(newAuthorName);
        }

        // Lưu lại vào Database
        articleRepository.saveAll(articles);
    }


    public Article rejectArticle(String id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết!"));
        article.setIsApproved(false);
        article.setIsRejected(true);
        Article saved = articleRepository.save(article);

        if (meilisearchService != null) {
            try {
                meilisearchService.deleteDocument("articles", id);
            } catch (Exception e) {
                System.err.println("⚠️ Meili delete skip: " + e.getMessage());
            }
        }
        return saved;
    }

    public void deleteArticle(String id) { articleRepository.deleteById(id); }

    public List<Article> getArticlesByAuthor(String email) {
        return articleRepository.findByAuthor(email);
    }

    public List<Article> getApprovedArticles() {
        return articleRepository.findByIsApprovedTrue();
    }

    public void authorDeleteArticle(String id, String authorEmail) {
        Optional<Article> opt = articleRepository.findById(id);
        if (opt.isPresent()) {
            Article article = opt.get();
            if (!article.getAuthor().equals(authorEmail)) {
                throw new RuntimeException("Bạn không có quyền xóa!");
            }

            // Fix: Phải dùng Boolean.TRUE.equals() để chống lỗi Null
            if (Boolean.TRUE.equals(article.getIsApproved()) || Boolean.TRUE.equals(article.getIsRejected())) {
                throw new RuntimeException("Bài viết đã được xử lý, không thể xóa!");
            }

            articleRepository.delete(article);
        } else {
            throw new RuntimeException("Không tìm thấy!");
        }
    }
}
