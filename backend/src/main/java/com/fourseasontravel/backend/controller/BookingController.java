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


import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@Tag(name = "Bookings", description = "Quản lý đặt tour (Tạo đặt tour, mã QR VietQR, duyệt, check-in, đánh giá...)")
@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;



    @Operation(summary = "Lấy toàn bộ danh sách đặt tour", description = "Dành riêng cho Admin để theo dõi và quản lý tất cả các yêu cầu đặt tour trên toàn hệ thống.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    @GetMapping
    public ResponseEntity<List<Booking>> getAll() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }



    @Operation(summary = "Tạo yêu cầu đặt tour mới", description = "Khách hàng tiến hành gửi thông tin đăng ký đặt tour mới (Chờ xác nhận thanh toán).")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Gửi yêu cầu đặt tour thành công"),
            @ApiResponse(responseCode = "400", description = "Lỗi dữ liệu đầu vào hoặc tour đã hết chỗ")
    })
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Booking booking) {
        try {
            Booking newBooking = bookingService.createBooking(booking);
            return new ResponseEntity<>(newBooking, HttpStatus.CREATED);

        } catch (RuntimeException e) {
            // Lỗi nghiệp vụ (hết chỗ, tour không tồn tại...)
            // Transaction đã tự rollback
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "error",   e.getMessage()
                    )
            );

        } catch (Exception e) {
            // Lỗi hệ thống / transaction timeout
            System.err.println(" createBooking error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    Map.of(
                            "success", false,
                            "error",   "Lỗi hệ thống! Vui lòng thử lại."
                    )
            );
        }
    }


    @Operation(summary = "Lấy thông tin tài khoản chuyển khoản QR (VietQR)", description = "Trả về thông tin chi tiết tài khoản hoặc link ảnh QR kèm số tiền cọc (20%) để hiển thị cho khách hàng trước khi họ nhấn Đặt tour.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy thông tin QR thành công"),
            @ApiResponse(responseCode = "400", description = "Lỗi xử lý thông tin")
    })
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


    @Operation(summary = "Hủy yêu cầu đặt tour (Admin)", description = "Dành cho Admin để chủ động hủy một yêu cầu đặt chỗ của khách hàng.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Hủy đặt tour thành công"),
            @ApiResponse(responseCode = "400", description = "Lỗi trong quá trình xử lý hủy")
    })
    // Thêm endpoint hủy booking
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable String id) {
        try {
            return ResponseEntity.ok(bookingService.cancelBooking(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @Operation(summary = "Xác nhận đặt tour thành công (Admin)", description = "Dành cho Admin xác nhận khách hàng đã chuyển khoản cọc thành công, cập nhật trạng thái đặt tour thành CONFIRMED.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Xác nhận thanh toán thành công"),
            @ApiResponse(responseCode = "400", description = "Lỗi trong quá trình phê duyệt")
    })
    @PutMapping("/{id}/confirm")
    public ResponseEntity<?> confirmBooking(@PathVariable String id) {
        try {
            Booking booking = bookingService.confirmBooking(id);
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @Operation(summary = "Lấy danh sách đặt tour chờ xác nhận (Admin)", description = "Admin lấy danh sách tất cả các đơn đặt tour đang ở trạng thái chờ duyệt chuyển khoản cọc.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công")
    })
    // Lấy danh sách booking chờ xác nhận
    @GetMapping("/pending")
    public ResponseEntity<List<Booking>> getPendingBookings() {
        return ResponseEntity.ok(bookingService.getPendingBookings());
    }


    @Operation(summary = "Lấy lịch sử đặt tour cá nhân", description = "Khách hàng lấy toàn bộ danh sách lịch sử các chuyến đi đã đặt của chính mình bằng tài khoản đang đăng nhập.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "41" , description = "Chưa đăng nhập")
    })
    // ── Lấy lịch sử booking của user ─────────────────────────────
    @GetMapping("/my-bookings")
    public ResponseEntity<List<Booking>> getMyBookings() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return ResponseEntity.ok(bookingService.getMyBookings(email));
    }


    @Operation(summary = "Khách hàng tự yêu cầu hủy đơn đặt tour", description = "Cho phép khách hàng tự yêu cầu hủy tour của mình và gửi kèm lý do hủy (Chỉ cho phép hủy trước ngày khởi hành theo quy định).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Yêu cầu hủy đơn thành công"),
            @ApiResponse(responseCode = "400", description = "Không thể tự hủy do vi phạm thời hạn hủy hoặc lỗi xử lý khác")
    })
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


    @Operation(summary = "Đánh giá chất lượng chuyến đi (Review/Rating)", description = "Cho phép khách hàng chấm điểm (1-5 sao) và viết nhận xét chi tiết sau khi hoàn thành chuyến đi thực tế.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Gửi đánh giá thành công"),
            @ApiResponse(responseCode = "400", description = "Bạn chưa hoàn thành chuyến đi này hoặc dữ liệu đánh giá không hợp lệ")
    })
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


    @Operation(summary = "Tác giả lấy danh sách đặt chỗ của tour mình tạo", description = "Cho phép người sáng tạo nội dung (Author) hoặc Admin của Tour xem danh sách chi tiết các hành khách đã đăng ký tham gia tour.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "403", description = "Không có quyền xem thông tin tour của tác giả khác")
    })
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


    @Operation(summary = "Xác nhận khách hàng đã đến tham gia tour (Check-in)", description = "Tác giả của tour thực hiện điểm danh, xác nhận hành khách đã có mặt tại điểm xuất phát vào ngày khởi hành.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Điểm danh check-in thành công"),
            @ApiResponse(responseCode = "400", description = "Lỗi khi xử lý điểm danh")
    })
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


    @Operation(summary = "Đánh dấu khách hàng vắng mặt không lý do (No-show)", description = "Tác giả của tour đánh dấu hành khách không xuất hiện tại điểm tập trung (Bỏ tour không thông báo trước).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Đánh dấu vắng mặt thành công"),
            @ApiResponse(responseCode = "400", description = "Lỗi trong quá trình xử lý")
    })
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


    @Operation(summary = "Kiểm tra khách hàng đã từng hoàn thành tour hay chưa", description = "Sử dụng để kiểm tra điều kiện hiển thị nút 'Đánh giá chuyến đi' ở phía Frontend ReactJS.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Kiểm tra thành công")
    })
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