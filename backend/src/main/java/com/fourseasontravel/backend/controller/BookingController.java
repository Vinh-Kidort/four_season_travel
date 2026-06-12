package com.fourseasontravel.backend.controller;

import com.fourseasontravel.backend.model.Booking;
import com.fourseasontravel.backend.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    // ── GIỮ NGUYÊN ────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<Booking>> getAll() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    // ── GIỮ NGUYÊN ────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Booking booking) {
        try {
            Booking newBooking = bookingService.createBooking(booking);
            return new ResponseEntity<>(newBooking, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── THÊM: endpoint lấy thông tin QR trước khi đặt ─────────────
    @GetMapping("/qr-info")
    public ResponseEntity<?> getQrInfo(
            @RequestParam String tourId,
            @RequestParam int    numberOfPeople,
            @RequestParam(required = false) String departureId) {  // ← THÊM
        try {
            return ResponseEntity.ok(
                    bookingService.getQrInfo(tourId, numberOfPeople, departureId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Thêm endpoint hủy booking
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable String id) {
        try {
            return ResponseEntity.ok(bookingService.cancelBooking(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<?> confirmBooking(@PathVariable String id) {
        try {
            Booking booking = bookingService.confirmBooking(id);
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Lấy danh sách booking chờ xác nhận
    @GetMapping("/pending")
    public ResponseEntity<List<Booking>> getPendingBookings() {
        return ResponseEntity.ok(bookingService.getPendingBookings());
    }

    // ── Lấy lịch sử booking của user ─────────────────────────────
    @GetMapping("/my-bookings")
    public ResponseEntity<List<Booking>> getMyBookings() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return ResponseEntity.ok(bookingService.getMyBookings(email));
    }

    // ── Hủy booking ───────────────────────────────────────────────
    @PutMapping("/{id}/cancel-by-user")
    public ResponseEntity<?> cancelByUser(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body) {
        String email  = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        String reason = body != null ? body.getOrDefault("reason", "") : "";
        try {
            return ResponseEntity.ok(
                    bookingService.cancelBookingByUser(id, email, reason));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Rating tour ───────────────────────────────────────────────
    @PostMapping("/{id}/rate")
    public ResponseEntity<?> rateTour(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        String email      = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        int    rating     = Integer.parseInt(body.get("rating").toString());
        String reviewText = (String) body.getOrDefault("reviewText", "");
        try {
            return ResponseEntity.ok(
                    bookingService.rateTour(id, email, rating, reviewText));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Author: lấy bookings của tour ────────────────────────────
    @GetMapping("/tour/{tourId}")
    public ResponseEntity<?> getTourBookings(@PathVariable String tourId) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        try {
            return ResponseEntity.ok(
                    bookingService.getTourBookingsForAuthor(tourId, email));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Author: Check-in ──────────────────────────────────────────
    @PutMapping("/{id}/check-in")
    public ResponseEntity<?> checkIn(@PathVariable String id) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        try {
            return ResponseEntity.ok(bookingService.checkIn(id, email));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Author: No-show ───────────────────────────────────────────
    @PutMapping("/{id}/no-show")
    public ResponseEntity<?> noShow(@PathVariable String id) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        try {
            return ResponseEntity.ok(bookingService.markNoShow(id, email));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Kiểm tra user đã join tour chưa ──────────────────────────
    @GetMapping("/check-joined")
    public ResponseEntity<?> checkJoined(
            @RequestParam String tourId) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return ResponseEntity.ok(Map.of(
                "joined", bookingService.hasUserJoinedTour(tourId, email)));
    }

}