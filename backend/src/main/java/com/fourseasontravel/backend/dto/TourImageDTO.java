package com.fourseasontravel.backend.dto;

import com.fourseasontravel.backend.model.Tour;
import lombok.Data;

@Data
public class TourImageDTO {
    private String url;
    private String caption;

    public static TourImageDTO from(Tour.TourImage img) {
        TourImageDTO dto = new TourImageDTO();
        dto.setUrl(img.getUrl());
        dto.setCaption(img.getCaption());
        return dto;
    }
}