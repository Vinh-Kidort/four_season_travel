package com.fourseasontravel.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "articles")
public class Article {
    @Id
    private String id;

    private String title;
    private String titleEn;
    private String summary;
    private String content;
    private String contentEn;
    private String locationId; 
    private String author;  // Lưu Email (Dùng để xác thực quyền)
    private String authorName; // THÊM MỚI: Lưu Tên hiển thị của tác giả
    private String imageUrl;
    private String createdAt;
    private Boolean isApproved;
    private Boolean isRejected = false;
    private Double averageRating = 0.0;
    private Integer reviewCount = 0;
    private List<ArticleSection> sections;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArticleSection {
        private String heading;   // Tiêu đề section (in đậm nhỏ)
        private String body;      // Nội dung section
    }
}