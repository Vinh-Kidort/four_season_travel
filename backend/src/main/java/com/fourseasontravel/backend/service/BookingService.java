package com.fourseasontravel.backend.service;

import com.fourseasontravel.backend.model.Booking;
import com.fourseasontravel.backend.model.Tour;
import com.fourseasontravel.backend.repository.BookingRepository;
import com.fourseasontravel.backend.repository.TourAtomicRepository;
import com.fourseasontravel.backend.repository.TourRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.fourseasontravel.backend.model.Review;
import com.fourseasontravel.backend.repository.ReviewRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class BookingService {

    @Autowired private BookingRepository    bookingRepository;
    @Autowired private TourRepository       tourRepository;
    @Autowired private TourAtomicRepository tourAtomicRepository; // ← THÊM
    @Autowired private EmailService         emailService;
    @Autowired private ReviewRepository     reviewRepository;

    @Value("${bank.account.number}") private String bankAccountNumber;
    @Value("${bank.account.name}")   private String bankAccountName;
    @Value("${bank.name}")           private String bankName;

    private String generateBookingCode() {
        String date   = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = String.format("%04X", new Random().nextInt(0xFFFF));
        return "FST-" + date + "-" + random;
    }

    public Map<String, Object> getQrInfo(String tourId, int numberOfPeople,
                                         String departureId) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Tour không tồn tại!"));

        // Lấy giá từ departure nếu có
        double unitPrice = tour.getPrice();
        String depStartDate = tour.getDepartureDate();
        String depEndDate   = tour.getDepartureDate();
        int    totalDays    = 1;

        if (departureId != null && tour.getDepartures() != null) {
            Optional<Tour.TourDeparture> depOpt = tour.getDepartures().stream()
                    .filter(d -> departureId.equals(d.getId()))
                    .findFirst();
            if (depOpt.isPresent()) {
                Tour.TourDeparture dep = depOpt.get();
                unitPrice    = dep.getPrice();
                depStartDate = dep.getStartDate();
                depEndDate   = dep.getEndDate();
                totalDays    = dep.getTotalDays() != null ? dep.getTotalDays() : 1;
            }
        }

        double totalPrice    = unitPrice * numberOfPeople;
        double depositAmount = Math.round(totalPrice * 0.20);
        String bookingCode   = generateBookingCode();

        String qrUrl = String.format(
                "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%.0f&addInfo=%s&accountName=%s",
                bankName.toLowerCase().replace(" ", ""),
                bankAccountNumber, depositAmount, bookingCode,
                bankAccountName.replace(" ", "%20")
        );

        Map<String, Object> result = new HashMap<>();
        result.put("bookingCode",    bookingCode);
        result.put("tourName",       tour.getName());
        result.put("totalPrice",     totalPrice);
        result.put("depositAmount",  depositAmount);
        result.put("qrUrl",          qrUrl);
        result.put("bankName",       bankName);
        result.put("bankAccount",    bankAccountNumber);
        result.put("bankOwner",      bankAccountName);
        result.put("departureStart", depStartDate);
        result.put("departureEnd",   depEndDate);
        result.put("totalDays",      totalDays);
        return result;
    }

    public Booking createBooking(Booking booking) {
        Tour tour = tourRepository.findById(booking.getTourId())
                .orElseThrow(() -> new RuntimeException("Tour không tồn tại!"));

        if (!"active".equals(tour.getStatus()))
            throw new RuntimeException("Tour này hiện không hoạt động!");

        int qty = booking.getNumberOfPeople();

        // ── ATOMIC UPDATE ─────────────────────────────────────────────
        if (booking.getDepartureId() != null && !booking.getDepartureId().isEmpty()) {
            // Có departure → atomic trừ slot departure
            Tour updated = tourAtomicRepository
                    .decrementDepartureSlots(booking.getTourId(), booking.getDepartureId(), qty);

            if (updated == null) {
                // null = không đủ chỗ hoặc departure không active
                throw new RuntimeException(
                        "Không đủ chỗ trống! Vui lòng chọn ngày khác hoặc giảm số người.");
            }

            // Lấy thông tin departure để tính giá
            updated.getDepartures().stream()
                    .filter(d -> booking.getDepartureId().equals(d.getId()))
                    .findFirst()
                    .ifPresent(dep -> {
                        double total = dep.getPrice() * qty;
                        booking.setTotalPrice(total);
                        booking.setDepositAmount((double) Math.round(total * 0.20));
                        // Lưu info ngày cho email
                        booking.setDepartureInfo(dep.getStartDate() + " → "
                                + dep.getEndDate() + " (" + dep.getTotalDays() + " ngày)");
                    });

        } else {
            // Không có departure → atomic trừ slot tour
            Tour updated = tourAtomicRepository
                    .decrementTourSlots(booking.getTourId(), qty);

            if (updated == null)
                throw new RuntimeException(
                        "Không đủ chỗ trống! Chỉ còn "
                                + tour.getAvailableSlots() + " chỗ.");

            double total = tour.getPrice() * qty;
            booking.setTotalPrice(total);
            booking.setDepositAmount((double) Math.round(total * 0.20));
        }

        // Gắn thông tin booking
        booking.setTourName(tour.getName());
        booking.setCreatedAt(LocalDateTime.now());
        booking.setStatus("pending_payment");

        if (booking.getBookingCode() == null || booking.getBookingCode().isEmpty())
            booking.setBookingCode(generateBookingCode());

        Booking saved = bookingRepository.save(booking);
        emailService.sendBookingConfirmation(saved, tour.getName());
        return saved;
    }

    public Booking confirmBooking(String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking!"));
        booking.setStatus("confirmed");
        booking.setConfirmedAt(LocalDateTime.now());
        return bookingRepository.save(booking);
    }

    // Hủy booking → hoàn trả slots
    public Booking cancelBooking(String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking!"));

        if ("cancelled".equals(booking.getStatus()))
            throw new RuntimeException("Booking đã bị hủy rồi!");

        booking.setStatus("cancelled");
        bookingRepository.save(booking);

        // ── Hoàn trả slots atomic ─────────────────────────────────
        if (booking.getDepartureId() != null && !booking.getDepartureId().isEmpty()) {
            tourAtomicRepository.incrementDepartureSlots(
                    booking.getTourId(), booking.getDepartureId(),
                    booking.getNumberOfPeople());
        } else {
            tourAtomicRepository.incrementTourSlots(
                    booking.getTourId(), booking.getNumberOfPeople());
        }

        return booking;
    }

    public List<Booking> getAllBookings()  { return bookingRepository.findAll(); }
    public List<Booking> getPendingBookings() {
        return bookingRepository.findByStatus("pending_payment");
    }
    public Optional<Booking> getById(String id) { return bookingRepository.findById(id); }

    // ── Lấy lịch sử booking của user ─────────────────────────────
    public List<Booking> getMyBookings(String email) {
        return bookingRepository.findByCustomerEmail(email)
                .stream()
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .collect(java.util.stream.Collectors.toList());
    }

    // ── Hủy booking + tính hoàn tiền ─────────────────────────────
    public Booking cancelBookingByUser(String bookingId, String email,
                                       String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking!"));

        if (!email.equals(booking.getCustomerEmail()))
            throw new RuntimeException("Bạn không có quyền hủy booking này!");

        if ("cancelled".equals(booking.getStatus())
                || "checked_in".equals(booking.getStatus()))
            throw new RuntimeException("Không thể hủy booking ở trạng thái này!");

        // Tính số ngày đến ngày khởi hành
        int daysUntilDeparture = getDaysUntilDeparture(booking);
        double refund = calculateRefund(booking.getDepositAmount(), daysUntilDeparture);

        booking.setStatus("cancelled");
        booking.setCancelledAt(LocalDateTime.now());
        booking.setCancelReason(reason);
        booking.setRefundAmount(refund);
        booking.setRefundStatus(refund > 0 ? "pending" : "none");

        // Hoàn trả slots
        if (booking.getDepartureId() != null && !booking.getDepartureId().isEmpty()) {
            tourAtomicRepository.incrementDepartureSlots(
                    booking.getTourId(), booking.getDepartureId(),
                    booking.getNumberOfPeople());
        } else {
            tourAtomicRepository.incrementTourSlots(
                    booking.getTourId(), booking.getNumberOfPeople());
        }

        return bookingRepository.save(booking);
    }

    // Tính số ngày đến khởi hành
    private int getDaysUntilDeparture(Booking booking) {
        try {
            // Lấy startDate từ departure
            Tour tour = tourRepository.findById(booking.getTourId()).orElse(null);
            if (tour != null && booking.getDepartureId() != null) {
                return tour.getDepartures().stream()
                        .filter(d -> booking.getDepartureId().equals(d.getId()))
                        .findFirst()
                        .map(dep -> {
                            java.time.LocalDate start =
                                    java.time.LocalDate.parse(dep.getStartDate());
                            return (int) java.time.temporal.ChronoUnit.DAYS.between(
                                    java.time.LocalDate.now(), start);
                        }).orElse(0);
            }
            // Fallback: dùng departureDate của tour
            if (tour != null && tour.getDepartureDate() != null) {
                java.time.LocalDate start =
                        java.time.LocalDate.parse(tour.getDepartureDate());
                return (int) java.time.temporal.ChronoUnit.DAYS.between(
                        java.time.LocalDate.now(), start);
            }
        } catch (Exception ignored) {}
        return 0;
    }

    // Tính hoàn tiền theo chính sách
    private double calculateRefund(double depositAmount, int daysUntilDeparture) {
        if (daysUntilDeparture >= 7)  return depositAmount;       // Hoàn 100%
        if (daysUntilDeparture >= 3)  return depositAmount * 0.5; // Hoàn 50%
        return 0;                                                  // Mất 100%
    }

    // ── Rating tour (chỉ user đã checkin) ────────────────────────
    public Booking rateTour(String bookingId, String email,
                            int rating, String reviewText) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking!"));

        if (!email.equals(booking.getCustomerEmail()))
            throw new RuntimeException("Bạn không có quyền đánh giá!");

        if (!"checked_in".equals(booking.getStatus()))
            throw new RuntimeException("Chỉ có thể đánh giá sau khi đã tham gia tour!");

        if (booking.getRating() != null)
            throw new RuntimeException("Bạn đã đánh giá tour này rồi!");

        if (rating < 1 || rating > 5)
            throw new RuntimeException("Rating phải từ 1 đến 5 sao!");

        // ── 1. Lưu rating vào Booking ────────────────────────────────
        booking.setRating(rating);
        booking.setReviewText(reviewText);
        booking.setRatedAt(LocalDateTime.now());
        bookingRepository.save(booking);

        // ── 2. Tạo Review document để hiển thị ở CommentSection ──────
        // Chỉ tạo nếu chưa có review từ user này cho tour này
        boolean alreadyReviewed = reviewRepository
                .existsByItemIdAndUserEmailAndRatingGreaterThan(
                        booking.getTourId(), email, 0);

        if (!alreadyReviewed) {
            Review review = new Review();
            review.setItemId(booking.getTourId());
            review.setItemType("TOUR");
            review.setUserEmail(email);
            review.setUserName(
                    booking.getCustomerName() != null
                            ? booking.getCustomerName()
                            : email.split("@")[0]
            );
            review.setContent(
                    reviewText != null && !reviewText.isBlank()
                            ? reviewText
                            : "Đã tham gia tour."
            );
            review.setRating(rating);
            review.setCreatedAt(java.time.LocalDate.now().toString());
            reviewRepository.save(review);

            // ── 3. Cập nhật averageRating cho Tour ───────────────────
            List<Review> allRated = reviewRepository
                    .findByItemIdAndRatingGreaterThan(booking.getTourId(), 0);
            double rawAvg = allRated.stream()
                    .mapToInt(Review::getRating).average().orElse(0.0);
            final double avg = Math.round(rawAvg * 10.0) / 10.0;

            tourRepository.findById(booking.getTourId()).ifPresent(tour -> {
                tour.setAverageRating(avg);
                tour.setReviewCount(allRated.size());
                tourRepository.save(tour);
            });
        }

        return booking;
    }

    // ── Check-in (Author xác nhận) ────────────────────────────────
    public Booking checkIn(String bookingId, String authorEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking!"));

        // Kiểm tra author có sở hữu tour không
        Tour tour = tourRepository.findById(booking.getTourId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tour!"));

        if (!authorEmail.equals(tour.getAuthor()))
            throw new RuntimeException("Bạn không có quyền xác nhận booking này!");

        if (!"confirmed".equals(booking.getStatus()))
            throw new RuntimeException("Booking chưa được xác nhận thanh toán!");

        booking.setStatus("checked_in");
        booking.setCheckedInAt(LocalDateTime.now());
        return bookingRepository.save(booking);
    }

    // ── Đánh dấu no_show (Author) ────────────────────────────────
    public Booking markNoShow(String bookingId, String authorEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking!"));

        Tour tour = tourRepository.findById(booking.getTourId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tour!"));

        if (!authorEmail.equals(tour.getAuthor()))
            throw new RuntimeException("Bạn không có quyền!");

        booking.setStatus("no_show");
        booking.setRefundAmount(0.0);
        booking.setRefundStatus("none");
        return bookingRepository.save(booking);
    }

    // ── Lấy bookings của tour cho Author ─────────────────────────
    public List<Booking> getTourBookingsForAuthor(String tourId, String authorEmail) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tour!"));

        if (!authorEmail.equals(tour.getAuthor()))
            throw new RuntimeException("Bạn không có quyền xem!");

        return bookingRepository.findByTourId(tourId)
                .stream()
                .filter(b -> !"pending_payment".equals(b.getStatus()))
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .collect(java.util.stream.Collectors.toList());
    }

    // ── Kiểm tra user đã tham gia tour chưa ──────────────────────
    public boolean hasUserJoinedTour(String tourId, String email) {
        return bookingRepository.existsByTourIdAndCustomerEmailAndStatusIn(
                tourId, email, List.of("checked_in"));
    }
}