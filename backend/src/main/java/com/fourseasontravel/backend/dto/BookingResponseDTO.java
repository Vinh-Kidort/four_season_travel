package com.fourseasontravel.backend.dto;

import com.fourseasontravel.backend.model.Booking;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookingResponseDTO {
    private String        id;
    private String        bookingCode;
    private String        tourId;
    private String        tourName;
    private String        departureId;
    private String        departureInfo;
    private String        customerName;
    private String        customerEmail;
    // KHÔNG expose customerPhone với người khác
    private Integer       numberOfPeople;
    private Double        totalPrice;
    private Double        depositAmount;
    private String        status;
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime checkedInAt;
    private LocalDateTime cancelledAt;
    private Integer       rating;
    private String        reviewText;
    private Double        refundAmount;
    private String        refundStatus;
    private String        cancelReason;

    public static BookingResponseDTO from(Booking booking) {
        BookingResponseDTO dto = new BookingResponseDTO();
        dto.setId(booking.getId());
        dto.setBookingCode(booking.getBookingCode());
        dto.setTourId(booking.getTourId());
        dto.setTourName(booking.getTourName());
        dto.setDepartureId(booking.getDepartureId());
        dto.setDepartureInfo(booking.getDepartureInfo());
        dto.setCustomerName(booking.getCustomerName());
        dto.setCustomerEmail(booking.getCustomerEmail());
        dto.setNumberOfPeople(booking.getNumberOfPeople());
        dto.setTotalPrice(booking.getTotalPrice());
        dto.setDepositAmount(booking.getDepositAmount());
        dto.setStatus(booking.getStatus());
        dto.setCreatedAt(booking.getCreatedAt());
        dto.setConfirmedAt(booking.getConfirmedAt());
        dto.setCheckedInAt(booking.getCheckedInAt());
        dto.setCancelledAt(booking.getCancelledAt());
        dto.setRating(booking.getRating());
        dto.setReviewText(booking.getReviewText());
        dto.setRefundAmount(booking.getRefundAmount());
        dto.setRefundStatus(booking.getRefundStatus());
        dto.setCancelReason(booking.getCancelReason());
        return dto;
    }
}