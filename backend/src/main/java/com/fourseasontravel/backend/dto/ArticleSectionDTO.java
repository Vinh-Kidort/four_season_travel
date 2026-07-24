package com.fourseasontravel.backend.dto;

import com.fourseasontravel.backend.model.Article;
import lombok.Data;

@Data
public class ArticleSectionDTO {
    private String heading;
    private String headingEn;
    private String body;
    private String bodyEn;

    public static ArticleSectionDTO from(Article.ArticleSection s) {
        ArticleSectionDTO dto = new ArticleSectionDTO();
        dto.setHeading(s.getHeading());
        dto.setHeadingEn(s.getHeadingEn());
        dto.setBody(s.getBody());
        dto.setBodyEn(s.getBodyEn());
        return dto;
    }
}