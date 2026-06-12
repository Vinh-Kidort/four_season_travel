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
@Document(collection = "tours")
public class Tour {
    @Id
    private String id;

    private String name;
    private String nameEn;
    private List<String> locationIds; // Danh sách ID các địa điểm tour sẽ đi qua
    private Double price;             // Giá tiền (VD: 2500000)
    private String duration;          // Thời gian (VD: "3 Ngày 2 Đêm")
    private String itinerary;         // Lịch trình chi tiết
    private String itineraryEn;
    private Integer maxSlots;          // Số chỗ tối đa: 20
    private Integer availableSlots;    // Số chỗ còn lại: 15
    private List<TourImage> images;
    private String experienceDescription;
    private String status;         // "active" hoặc "inactive"
    private String departureDate;
    private List<TourDeparture> departures;
    private Double averageRating = 0.0;
    private Integer reviewCount = 0;
    private Boolean isApproved;
    private String author;     // Email của người tạo
    private String createdAt;  // Ngày tạo
    private Boolean isRejected = false;
    private String region;


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TourImage {
        private String url;
        private String caption;
    }


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TourDeparture {
        private String id;           // UUID để identify từng departure
        private String startDate;    // "2024-12-03"
        private String endDate;      // "2024-12-05"
        private Integer totalDays;    // 3 (tự tính hoặc nhập)
        private Double price;        // Giá riêng cho departure này
        private Integer maxSlots;     // Số chỗ tối đa
        private Integer availableSlots; // Số chỗ còn
        private String status;       // "active" | "suspended"
        private String note;         // Ghi chú (VD: "Tạm ngưng do bão")

        public Integer getMaxSlots() {
            return maxSlots;
        }
    }
}

