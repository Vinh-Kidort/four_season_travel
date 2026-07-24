package com.fourseasontravel.backend.dto;

import com.fourseasontravel.backend.model.Tour;
import lombok.Data;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class TourResponseDTO {
    private String           id;
    private String           name;
    private String           nameEn;
    private List<String>     locationIds;
    private Double           price;
    private String           duration;
    private String           itinerary;
    private String           itineraryEn;
    private String           experienceDescription;
    private String           experienceDescriptionEn;
    private Integer          maxSlots;
    private Integer          availableSlots;
    private List<TourImageDTO>  images;
    private List<DepartureDTO>  departures;
    private String           status;
    private String           departureDate;
    private Double           averageRating;
    private Integer          reviewCount;
    // KHÔNG expose: isApproved, isRejected, author email

    public static TourResponseDTO from(Tour tour) {
        TourResponseDTO dto = new TourResponseDTO();
        dto.setId(tour.getId());
        dto.setName(tour.getName());
        dto.setNameEn(tour.getNameEn());
        dto.setLocationIds(tour.getLocationIds());
        dto.setPrice(tour.getPrice());
        dto.setDuration(tour.getDuration());
        dto.setItinerary(tour.getItinerary());
        dto.setItineraryEn(tour.getItineraryEn());
        dto.setExperienceDescription(tour.getExperienceDescription());
        dto.setExperienceDescriptionEn(tour.getExperienceDescriptionEn());
        dto.setMaxSlots(tour.getMaxSlots());
        dto.setAvailableSlots(tour.getAvailableSlots());
        dto.setStatus(tour.getStatus());
        dto.setDepartureDate(tour.getDepartureDate());
        dto.setAverageRating(tour.getAverageRating());
        dto.setReviewCount(tour.getReviewCount());

        // Images
        dto.setImages(tour.getImages() != null
                ? tour.getImages().stream()
                  .map(TourImageDTO::from)
                  .collect(Collectors.toList())
                : Collections.emptyList());

        // Departures
        dto.setDepartures(tour.getDepartures() != null
                ? tour.getDepartures().stream()
                  .map(DepartureDTO::from)
                  .collect(Collectors.toList())
                : Collections.emptyList());

        return dto;
    }
}