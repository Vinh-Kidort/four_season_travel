package com.fourseasontravel.backend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "reviews")
public class Review {
    @Id
    private String id;
    private String itemId;     // ID của Location hoặc Article
    private String itemType;   // "LOCATION" hoặc "ARTICLE"
    private String userEmail;
    private String userName;
    private String content;    // Nội dung comment
    private Integer rating;    // 1 đến 5 sao (0 hoặc null nghĩa là không đánh giá)
    private String createdAt;
}