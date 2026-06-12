package com.fourseasontravel.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "favorites")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Favorite {
    @Id
    private String id;

    private String userId;         // email hoặc userId của user
    private String itemId;         // id của tour/location/article
    private String itemType;       // "TOUR" | "LOCATION" | "ARTICLE"
    private LocalDateTime createdAt;
}