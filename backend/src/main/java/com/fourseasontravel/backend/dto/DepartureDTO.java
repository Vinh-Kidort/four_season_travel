package com.fourseasontravel.backend.dto;

import com.fourseasontravel.backend.model.Tour;
import lombok.Data;

@Data
public class DepartureDTO {
    private String  id;
    private String  startDate;
    private String  endDate;
    private Integer totalDays;
    private Double  price;
    private Integer maxSlots;
    private Integer availableSlots;
    private String  status;
    private String  note;

    public static DepartureDTO from(Tour.TourDeparture dep) {
        DepartureDTO dto = new DepartureDTO();
        dto.setId(dep.getId());
        dto.setStartDate(dep.getStartDate());
        dto.setEndDate(dep.getEndDate());
        dto.setTotalDays(dep.getTotalDays());
        dto.setPrice(dep.getPrice());
        dto.setMaxSlots(dep.getMaxSlots());
        dto.setAvailableSlots(dep.getAvailableSlots());
        dto.setStatus(dep.getStatus());
        dto.setNote(dep.getNote());
        return dto;
    }
}