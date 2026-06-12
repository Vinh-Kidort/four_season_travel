package com.fourseasontravel.backend.controller;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class RevenueResponse {
    private Double totalRevenue;     // Tổng doanh thu
    private Integer totalBookings;   // Tổng số đơn
    private List<Map<String, Object>> pendingBookingsList;
    private List<Map<String, Object>> chartData; // Dữ liệu vẽ biểu đồ
    private List<Map<String, Object>> topTours;  // Danh sách Top Tour
}