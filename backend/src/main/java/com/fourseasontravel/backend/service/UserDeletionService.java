package com.fourseasontravel.backend.service;

import com.fourseasontravel.backend.model.Booking;
import com.fourseasontravel.backend.model.User;
import com.fourseasontravel.backend.repository.BookingRepository;
import com.fourseasontravel.backend.repository.FavoriteRepository;
import com.fourseasontravel.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class UserDeletionService {

    @Autowired private UserRepository     userRepository;
    @Autowired private BookingRepository  bookingRepository;
    @Autowired private FavoriteRepository favoriteRepository;
    @Autowired private MongoTemplate      mongoTemplate;

    // Các status booking được coi là "đang có chuyến đi chưa hoàn tất"
    private static final List<String> ACTIVE_BOOKING_STATUSES =
            List.of("pending_payment", "confirmed");

    public void deleteAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản!"));

        // ── Kiểm tra tour đang cọc/chưa đi ──────────────────────────
        List<Booking> activeBookings = bookingRepository
                .findByCustomerEmailAndStatusIn(email, ACTIVE_BOOKING_STATUSES);

        if (!activeBookings.isEmpty()) {
            throw new RuntimeException(
                    "Bạn đang có " + activeBookings.size()
                            + " chuyến đi chưa hoàn tất. "
                            + "Vui lòng hủy tour hoặc hoàn thành chuyến đi "
                            + "trước khi xóa tài khoản!");
        }

        String uid = UUID.randomUUID().toString().substring(0, 8);

        // ── 1. Ẩn danh hóa User ───────────────────────────────────────
        user.setEmail("deleted_user_" + uid + "@fourseason.com");
        user.setName("Người dùng đã xóa");
        user.setPassword(""); // Không cho đăng nhập
        user.setStatus("deleted");
        user.setIsLocked(true);
        userRepository.save(user);

        // ── 2. Ẩn danh hóa Review/Comment ────────────────────────────
        // Giữ rating + content, chỉ đổi tên
        Query reviewQuery = new Query(Criteria.where("userEmail").is(email));
        Update reviewUpdate = new Update()
                .set("userName",  "Khách ẩn danh")
                .set("userEmail", "");
        mongoTemplate.updateMulti(reviewQuery, reviewUpdate, "reviews");


        // ── 3. Booking — giữ nguyên, chỉ đổi tên hiển thị ───────────
        Query bookingQuery = new Query(Criteria.where("customerEmail").is(email));
        Update bookingUpdate = new Update()
                .set("customerName",  "Khách ẩn danh")
                .set("customerEmail", "deleted_" + uid + "@fourseason.com");
        mongoTemplate.updateMulti(bookingQuery, bookingUpdate, "bookings");

        // ── 4. Xóa Favorites ─────────────────────────────────────────
        favoriteRepository.deleteByUserId(user.getId());
    }
}