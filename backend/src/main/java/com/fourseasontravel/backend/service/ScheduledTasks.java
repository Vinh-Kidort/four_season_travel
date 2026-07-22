package com.fourseasontravel.backend.service;

import com.fourseasontravel.backend.model.Booking;
import com.fourseasontravel.backend.model.Tour;
import com.fourseasontravel.backend.repository.BookingRepository;
import com.fourseasontravel.backend.repository.TourAtomicRepository;
import com.fourseasontravel.backend.repository.TourRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class ScheduledTasks {

    @Autowired private BookingRepository      bookingRepository;
    @Autowired private TourRepository         tourRepository;
    @Autowired private SearchService          searchService;
    @Autowired private EmailService           emailService;
    @Autowired private BookingService         bookingService;

    // ── 1. Tự động hủy booking chờ quá 24h ──────────────────
    // Chạy mỗi giờ
    @Scheduled(fixedRate = 3600000)
    public void cancelExpiredBookings() {
        try {
            LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
            List<Booking> expired = bookingRepository
                    .findByStatusAndCreatedAtBefore("pending_payment", cutoff);

            if (!expired.isEmpty()) {
                int successCount = 0;
                for (Booking b : expired) {
                    try {
                        // Gọi trực tiếp BookingService để thực hiện Transaction an toàn
                        bookingService.cancelBooking(b.getId());
                        successCount++;
                    } catch (Exception e) {
                        System.err.println("❌ Failed to cancel booking " + b.getId() + ": " + e.getMessage());
                    }
                }
                System.out.println("⏰ Auto-cancelled " + successCount + "/" + expired.size() + " expired bookings");
            }
        } catch (Exception e) {
            System.err.println("❌ cancelExpiredBookings error: " + e.getMessage());
        }
    }

    // ── 2. Nhắc nhở khách hàng 3 ngày trước khởi hành ───────
    // Chạy mỗi ngày lúc 8:00 sáng
    @Scheduled(cron = "0 0 8 * * *")
    public void sendDepartureReminders() {
        try {
            String targetDate = LocalDate.now().plusDays(3).toString();
            List<Booking> bookings = bookingRepository
                    .findByStatusAndDepartureInfo("confirmed", targetDate);

            for (Booking b : bookings) {
                emailService.sendDepartureReminder(b);
            }

            if (!bookings.isEmpty()) {
                System.out.println("📧 Sent " + bookings.size() + " departure reminders");
            }
        } catch (Exception e) {
            System.err.println("❌ sendDepartureReminders error: " + e.getMessage());
        }
    }

    // ── 3. Sync Meilisearch hàng đêm ─────────────────────────
    // Chạy mỗi đêm lúc 2:00 sáng
    @Scheduled(cron = "0 0 2 * * *")
    public void nightlyMeilisearchSync() {
        try {
            searchService.syncAll();
            System.out.println("🔄 Nightly Meilisearch sync completed");
        } catch (Exception e) {
            System.err.println("❌ Nightly sync error: " + e.getMessage());
        }
    }

    // ── 4. Ẩn tour hết hạn khởi hành ────────────────────────
    // Chạy mỗi ngày lúc 0:00
    @Scheduled(cron = "0 0 0 * * *")
    public void hideExpiredDepartures() {
        try {
            String today = LocalDate.now().toString();
            List<Tour> tours = tourRepository.findAll();
            int count = 0;

            for (Tour tour : tours) {
                if (tour.getDepartures() == null) continue;
                boolean changed = false;

                for (Tour.TourDeparture dep : tour.getDepartures()) {
                    // Departure đã qua + còn active → suspend tự động
                    if ("active".equals(dep.getStatus())
                            && dep.getEndDate() != null
                            && dep.getEndDate().compareTo(today) < 0) {
                        dep.setStatus("suspended");
                        dep.setNote("Tự động đóng sau khi kết thúc");
                        changed = true;
                        count++;
                    }
                }

                if (changed) tourRepository.save(tour);
            }

            if (count > 0) {
                System.out.println("🗓️ Auto-suspended " + count + " expired departures");
            }
        } catch (Exception e) {
            System.err.println("❌ hideExpiredDepartures error: " + e.getMessage());
        }
    }

    // ── 5. Dọn dẹp OTP cache (log) ───────────────────────────
    // Chạy mỗi ngày lúc 3:00 sáng
    @Scheduled(cron = "0 0 3 * * *")
    public void logDailyStats() {
        try {
            long totalBookings  = bookingRepository.count();
            long pendingBookings = bookingRepository
                    .countByStatus("pending_payment");

            System.out.println("📊 Daily Stats:");
            System.out.println("   Total bookings:   " + totalBookings);
            System.out.println("   Pending bookings: " + pendingBookings);
        } catch (Exception e) {
            System.err.println("❌ logDailyStats error: " + e.getMessage());
        }
    }
}