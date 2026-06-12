package com.fourseasontravel.backend.controller;

import com.fourseasontravel.backend.model.Booking;
import com.fourseasontravel.backend.model.Tour;
import com.fourseasontravel.backend.repository.BookingRepository;
import com.fourseasontravel.backend.repository.TourRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/revenue")
public class RevenueController {

    @Autowired private BookingRepository bookingRepository;
    @Autowired private TourRepository    tourRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<RevenueResponse> getDashboardData(
            @RequestParam int    year,
            @RequestParam String type) {

        List<Booking> allBookings = bookingRepository.findAll();

        double totalRevenue  = 0;
        int    totalBookings = 0;
        List<Map<String, Object>> pendingList = new ArrayList<>();

        int maxLoop = type.equals("month") ? 12 : 4;
        Map<Integer, Double> chartMap = new LinkedHashMap<>();
        for (int i = 1; i <= maxLoop; i++) chartMap.put(i, 0.0);

        Map<String, Double> tourRevenueMap = new HashMap<>();
        // ── THÊM: lưu tên tour + departureDate từ booking ────────────
        Map<String, String> tourNameMap          = new HashMap<>();
        Map<String, String> tourDepartureDateMap = new HashMap<>();

        for (Booking b : allBookings) {

            // ── Đơn chờ xác nhận ─────────────────────────────────────
            if ("pending_payment".equals(b.getStatus())) {
                Map<String, Object> item = new HashMap<>();
                item.put("id",             b.getId());
                item.put("bookingCode",    b.getBookingCode());
                item.put("customerName",   b.getCustomerName());
                item.put("customerEmail",  b.getCustomerEmail());
                item.put("numberOfPeople", b.getNumberOfPeople());
                item.put("totalPrice",     b.getTotalPrice());
                item.put("amount",         b.getDepositAmount() != null
                        ? b.getDepositAmount()
                        : (b.getTotalPrice() != null ? b.getTotalPrice() * 0.2 : 0));

                // ── FIX: ưu tiên lấy từ booking, fallback query tour ──
                String tourName     = b.getTourName();
                String departureStr = "";

                Optional<Tour> tourOpt = tourRepository.findById(
                        b.getTourId() != null ? b.getTourId() : "");
                if (tourOpt.isPresent()) {
                    if (tourName == null || tourName.isEmpty())
                        tourName = tourOpt.get().getName();
                    departureStr = tourOpt.get().getDepartureDate() != null
                            ? tourOpt.get().getDepartureDate() : "";
                } else {
                    if (tourName == null || tourName.isEmpty())
                        tourName = "Tour đã bị xóa";
                }

                item.put("tourName",      tourName);
                item.put("departureDate", departureStr);
                pendingList.add(item);
                continue;
            }

            // ── Chỉ tính đơn confirmed ────────────────────────────────
            if (!"confirmed".equals(b.getStatus())) continue;

            // ── Lấy departureDate làm mốc doanh thu ──────────────────
            // Ưu tiên từ Tour, fallback lưu vào map để dùng sau
            String departureDateStr = null;

            Optional<Tour> tourOpt = tourRepository.findById(
                    b.getTourId() != null ? b.getTourId() : "");

            if (tourOpt.isPresent()) {
                Tour tour = tourOpt.get();
                departureDateStr = tour.getDepartureDate();

                // Lưu tên + departureDate vào map
                tourNameMap.put(b.getTourId(), tour.getName());
                tourDepartureDateMap.put(b.getTourId(),
                        tour.getDepartureDate() != null ? tour.getDepartureDate() : "");
            } else {
                // Tour đã bị xóa — lấy từ map đã lưu trước đó (nếu có)
                // hoặc lấy từ booking nếu có lưu departureDate
                departureDateStr = tourDepartureDateMap.get(b.getTourId());

                // Lưu tên từ booking nếu chưa có
                if (!tourNameMap.containsKey(b.getTourId())) {
                    String savedName = b.getTourName();
                    tourNameMap.put(b.getTourId(),
                            savedName != null && !savedName.isEmpty()
                                    ? savedName : "Tour đã bị xóa");
                }
            }

            if (departureDateStr == null || departureDateStr.isEmpty()) continue;

            LocalDate date = parseDate(departureDateStr);
            if (date == null || date.getYear() != year) continue;

            double money = b.getDepositAmount() != null ? b.getDepositAmount() : 0;
            totalRevenue  += money;
            totalBookings++;

            // Biểu đồ
            if (type.equals("month")) {
                int m = date.getMonthValue();
                chartMap.put(m, chartMap.get(m) + money);
            } else {
                int q = (date.getMonthValue() - 1) / 3 + 1;
                chartMap.put(q, chartMap.get(q) + money);
            }

            // Top tour
            tourRevenueMap.put(b.getTourId(),
                    tourRevenueMap.getOrDefault(b.getTourId(), 0.0) + money);
        }

        // ── Chart data ────────────────────────────────────────────────
        List<Map<String, Object>> chartData = new ArrayList<>();
        for (int i = 1; i <= maxLoop; i++) {
            Map<String, Object> pt = new LinkedHashMap<>();
            pt.put("name",    (type.equals("month") ? "Tháng " : "Quý ") + i);
            pt.put("revenue", chartMap.get(i));
            chartData.add(pt);
        }

        // ── Top 5 tour — FIX: dùng tourNameMap thay vì query lại ──────
        List<Map<String, Object>> topTours = tourRevenueMap.entrySet().stream()
                .sorted((a, b2) -> Double.compare(b2.getValue(), a.getValue()))
                .limit(5)
                .map(entry -> {
                    Map<String, Object> m = new LinkedHashMap<>();

                    // Lấy tên từ map — không query DB nữa
                    m.put("tourName", tourNameMap.getOrDefault(
                            entry.getKey(), "Tour đã bị xóa"));

                    // Lấy departureDate từ map
                    m.put("departureDate", tourDepartureDateMap.getOrDefault(
                            entry.getKey(), ""));

                    m.put("revenue", entry.getValue());
                    return m;
                }).collect(Collectors.toList());

        RevenueResponse resp = new RevenueResponse();
        resp.setTotalRevenue(totalRevenue);
        resp.setTotalBookings(totalBookings);
        resp.setPendingBookingsList(pendingList);
        resp.setChartData(chartData);
        resp.setTopTours(topTours);

        return ResponseEntity.ok(resp);
    }

    // ── Helper parse ngày linh hoạt ───────────────────────────────────
    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) return null;
        try { return LocalDate.parse(dateStr); } catch (Exception ignored) {}
        try { return LocalDate.parse(dateStr,
                DateTimeFormatter.ofPattern("dd/MM/yyyy")); } catch (Exception ignored) {}
        try { return LocalDate.parse(dateStr,
                DateTimeFormatter.ofPattern("d/M/yyyy")); } catch (Exception ignored) {}
        return null;
    }
}