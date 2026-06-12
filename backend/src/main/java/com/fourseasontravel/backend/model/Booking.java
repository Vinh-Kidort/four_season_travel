package com.fourseasontravel.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "bookings")
public class Booking {
    @Id
    private String id;

    private String tourId;         // Đặt Tour nào?
    private String tourName;
    private String customerName;   // Tên khách hàng (Tạm thời nhập tay, sau này có Login thì lấy từ User)
    private String customerEmail;
    private String customerPhone;  // Số điện thoại
    private Integer numberOfPeople;    // Số lượng người đi (VD: Đặt cho 3 người)
    private Double totalPrice;     // Tổng tiền (Giá tour * số người)
    private Double depositAmount;      // Tiền cọc 20%
    private String bookingCode;        // Mã đặt tour VD: FST-20240520-XXXX

    private String bookingDate;    // Ngày đặt (VD: "2023-11-20")
    private String departureId;
    private String departureInfo;
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime checkedInAt;
    private LocalDateTime cancelledAt;

    //Rating
    private Integer rating;       // 1-5 sao
    private String  reviewText;
    private LocalDateTime ratedAt;

    //  Hoàn tiền
    private Double  refundAmount;  // Số tiền được hoàn
    private String  refundStatus;  // "pending" | "refunded" | "none"
    private String  cancelReason;

    private String status;         // pending_payment → confirmed → checked_in | no_show | cancelled

}