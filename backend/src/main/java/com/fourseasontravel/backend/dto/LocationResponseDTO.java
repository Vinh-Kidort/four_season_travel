package com.fourseasontravel.backend.dto;

import com.fourseasontravel.backend.model.Location;
import lombok.Data;

import java.util.List;

@Data
public class LocationResponseDTO {
    private String       id;
    private String       name;
    private String       nameEn;
    private String       region;
    private String       regionEn;
    private String       description;
    private String       descriptionEn;
    private String       bestSeason;
    private String       bestSeasonEn;
    private List<String> images;
    private Double       averageRating;
    private Integer      reviewCount;

    public static LocationResponseDTO from(Location loc) {
        LocationResponseDTO dto = new LocationResponseDTO();
        dto.setId(loc.getId());
        dto.setName(loc.getName());
        dto.setNameEn(loc.getNameEn());
        dto.setRegion(loc.getRegion());
        dto.setRegionEn(loc.getRegionEn());
        dto.setDescription(loc.getDescription());
        dto.setDescriptionEn(loc.getDescriptionEn());
        dto.setBestSeason(loc.getBestSeason());
        dto.setBestSeasonEn(loc.getBestSeasonEn());
        dto.setImages(loc.getImages());
        dto.setAverageRating(loc.getAverageRating());
        dto.setReviewCount(loc.getReviewCount());
        return dto;
    }
}