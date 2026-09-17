package com.fourseasontravel.backend.service;

import com.fourseasontravel.backend.model.Booking;
import com.fourseasontravel.backend.model.Tour;
import com.fourseasontravel.backend.repository.BookingRepository;
import com.fourseasontravel.backend.repository.ReviewRepository;
import com.fourseasontravel.backend.repository.TourRepository;
import com.fourseasontravel.backend.repository.TourAtomicRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import java.util.Optional;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
class BookingServiceTest {

    @Mock private BookingRepository    bookingRepository;
    @Mock private TourRepository       tourRepository;
    @Mock private TourAtomicRepository tourAtomicRepository;
    @Mock private EmailService         emailService;
    @Mock private ReviewRepository reviewRepository; // ← THÊM

    @InjectMocks private BookingService bookingService;

    private Tour    sampleTour;
    private Booking sampleBooking;

    @BeforeEach
    void setUp() {
        sampleTour = new Tour();
        sampleTour.setId("tour-1");
        sampleTour.setName("Tour Đà Lạt");
        sampleTour.setPrice(5000000.0);
        sampleTour.setAvailableSlots(10);
        sampleTour.setStatus("active");

        sampleBooking = new Booking();
        sampleBooking.setTourId("tour-1");
        sampleBooking.setCustomerEmail("test@test.com");
        sampleBooking.setNumberOfPeople(2);
    }

    // ── Test 1: Tạo booking thành công ───────────────────────
    @Test
    @DisplayName("Tạo booking thành công khi còn chỗ")
    void createBooking_Success() {
        when(tourRepository.findById("tour-1"))
                .thenReturn(Optional.of(sampleTour));
        when(tourAtomicRepository.decrementTourSlots("tour-1", 2))
                .thenReturn(sampleTour);
        when(bookingRepository.save(any(Booking.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        Booking result = bookingService.createBooking(sampleBooking);

        assertNotNull(result);
        assertEquals("pending_payment", result.getStatus());
        assertEquals(10000000.0, result.getTotalPrice());
        assertEquals(2000000.0, result.getDepositAmount());
        verify(bookingRepository, times(1)).save(any());
    }

    // ── Test 2: Không đủ chỗ ─────────────────────────────────
    @Test
    @DisplayName("Throw exception khi không đủ chỗ")
    void createBooking_InsufficientSlots() {
        when(tourRepository.findById("tour-1"))
                .thenReturn(Optional.of(sampleTour));
        when(tourAtomicRepository.decrementTourSlots("tour-1", 2))
                .thenReturn(null); // null = hết chỗ

        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> bookingService.createBooking(sampleBooking)
        );

        assertTrue(ex.getMessage().contains("Không đủ chỗ"));
        verify(bookingRepository, never()).save(any());
    }

    // ── Test 3: Tour không tồn tại ───────────────────────────
    @Test
    @DisplayName("Throw exception khi tour không tồn tại")
    void createBooking_TourNotFound() {
        when(tourRepository.findById("tour-1"))
                .thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> bookingService.createBooking(sampleBooking));
    }

    // ── Test 4: Hủy booking thành công ───────────────────────
    @Test
    @DisplayName("Hủy booking và hoàn slot thành công")
    void cancelBooking_Success() {
        sampleBooking.setId("booking-1");
        sampleBooking.setStatus("confirmed");
        sampleBooking.setDepositAmount(1000000.0);
        sampleBooking.setDepartureInfo("2025-12-31 → 2025-12-31 (1 ngày)");

        when(bookingRepository.findById("booking-1"))
                .thenReturn(Optional.of(sampleBooking));
        when(bookingRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Booking result = bookingService.cancelBooking("booking-1");

        assertEquals("cancelled", result.getStatus());
        verify(tourAtomicRepository, times(1))
                .incrementTourSlots(any(), anyInt());
    }

    // ── Test 5: Rating chỉ cho phép sau check-in ─────────────
    @Test
    @DisplayName("Rating chỉ cho phép sau check-in")
    void rateTour_OnlyAfterCheckIn() {
        sampleBooking.setId("booking-1");
        sampleBooking.setStatus("confirmed"); // chưa check-in
        sampleBooking.setCustomerEmail("test@test.com"); // ← THÊM

        when(bookingRepository.findById("booking-1"))
                .thenReturn(Optional.of(sampleBooking));

        assertThrows(RuntimeException.class,
                () -> bookingService.rateTour(
                        "booking-1",
                        "test@test.com", // ← email tham số thứ 2
                        5,
                        "Tốt lắm!"
                ));
    }

    // ── Test 6: Rating không hợp lệ ──────────────────────────
    @Test
    @DisplayName("Rating phải từ 1-5")
    void rateTour_InvalidRating() {
//        sampleBooking.setId("booking-1");
//        sampleBooking.setStatus("checked_in");
//        sampleBooking.setCustomerEmail("test@test.com"); // ← THÊM
//
//        when(bookingRepository.findById("booking-1"))
//                .thenReturn(Optional.of(sampleBooking));
//
//        // Mock reviewRepository để không bị NullPointerException
//        when(reviewRepository.existsByItemIdAndUserEmailAndRatingGreaterThan(
//                any(), any(), anyInt())).thenReturn(false);

        assertThrows(RuntimeException.class,
                () -> bookingService.rateTour(
                        "booking-1",
                        "test@test.com", // ← email tham số thứ 2
                        6,               // ← rating không hợp lệ
                        "Test"
                ));
    }
}