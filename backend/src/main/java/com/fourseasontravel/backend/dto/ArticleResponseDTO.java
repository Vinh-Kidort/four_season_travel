package com.fourseasontravel.backend.dto;

import com.fourseasontravel.backend.model.Article;
import lombok.Data;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class ArticleResponseDTO {
    private String                  id;
    private String                  title;
    private String                  titleEn;
    private String                  summary;
    private String                  summaryEn;
    private String                  content;
    private String                  contentEn;
    private String                  locationId;
    private String                  author;
    private String                  imageUrl;
    private String                  createdAt;
    private List<ArticleSectionDTO> sections;
    private Double                  averageRating;
    private Integer                 reviewCount;
    // KHÔNG expose: isApproved, isRejected

    public static ArticleResponseDTO from(Article article) {
        ArticleResponseDTO dto = new ArticleResponseDTO();
        dto.setId(article.getId());
        dto.setTitle(article.getTitle());
        dto.setTitleEn(article.getTitleEn());
        dto.setSummary(article.getSummary());
        dto.setSummaryEn(article.getSummaryEn());
        dto.setContent(article.getContent());
        dto.setContentEn(article.getContentEn());
        dto.setLocationId(article.getLocationId());
        dto.setAuthor(article.getAuthor());
        dto.setImageUrl(article.getImageUrl());
        dto.setCreatedAt(article.getCreatedAt());
        dto.setAverageRating(article.getAverageRating());
        dto.setReviewCount(article.getReviewCount());

        dto.setSections(article.getSections() != null
                ? article.getSections().stream()
                  .map(ArticleSectionDTO::from)
                  .collect(Collectors.toList())
                : Collections.emptyList());

        return dto;
    }
}