package com.fourseasontravel.backend.service;

import com.fourseasontravel.backend.model.Tour;
import com.fourseasontravel.backend.repository.TourRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TourService {


    private MeilisearchService meilisearchService;

    @Autowired
    public void setMeilisearchService(
            @Lazy MeilisearchService meilisearchService) {
        this.meilisearchService = meilisearchService;
    }

    @Autowired
    private TourRepository tourRepository;


    // SỬA HÀM CŨ: Chỉ trả về tour đã duyệt
    // Chỉ hiện tour đã duyệt + còn chỗ trên giao diện người dùng
    public List<Tour> getAllTours() {
        return tourRepository.findByIsApprovedTrue()
                .stream()
                .filter(t -> !Boolean.TRUE.equals(t.getIsRejected()))
                .filter(t -> t.getAvailableSlots() != null && t.getAvailableSlots() > 0)
                .collect(java.util.stream.Collectors.toList());
    }

    // Hàm mới cho Admin xem tất cả kể cả hết chỗ
    public List<Tour> getAllToursForAdmin() {
        return tourRepository.findAll();
    }

    // THÊM HÀM MỚI 1: Lấy danh sách chờ duyệt (Cho Admin)
    public List<Tour> getPendingTours() {
        return tourRepository.findByIsApprovedFalseAndIsRejectedFalse();
    }

    // THÊM HÀM MỚI 2: Duyệt Tour
    public Tour approveTour(String id) {
        Optional<Tour> tourOpt = tourRepository.findById(id);
        if (tourOpt.isPresent()) {
            Tour tour = tourOpt.get();
            tour.setIsApproved(true); // Chuyển trạng thái sang Đã duyệt
            Tour saved = tourRepository.save(tour);

            // Sync Meilisearch — bọc null check
            if (meilisearchService != null) {
                try {
                    meilisearchService.syncTours();
                } catch (Exception e) {
                    System.err.println("⚠️ Meili sync skip: " + e.getMessage());
                }
            }
            return saved;
        }
        throw new RuntimeException("Không tìm thấy Tour!");
    }

    public Optional<Tour> getTourById(String id) { return tourRepository.findById(id); }

    public Tour createTour(Tour tour, String email) {
        tour.setAuthor(email);
        tour.setCreatedAt(java.time.Instant.now().toString());
        tour.setIsApproved(false);
        tour.setIsRejected(false);
        tour.setAvailableSlots(tour.getMaxSlots());

        if (tour.getStatus() == null || tour.getStatus().trim().isEmpty()) {
            tour.setStatus("active");
        }

        // ── THÊM: tạo departure mặc định từ departureDate ────────────
        if (tour.getDepartures() == null || tour.getDepartures().isEmpty()) {
            if (tour.getDepartureDate() != null && !tour.getDepartureDate().isEmpty()) {
                Tour.TourDeparture defaultDep = new Tour.TourDeparture();
                defaultDep.setId(java.util.UUID.randomUUID().toString().substring(0, 8));
                defaultDep.setStartDate(tour.getDepartureDate());

                // Tính endDate từ duration (VD: "3 Ngày 2 Đêm" → +2 ngày)
                try {
                    java.time.LocalDate start = java.time.LocalDate.parse(tour.getDepartureDate());
                    int days = extractDays(tour.getDuration()); // hàm helper bên dưới
                    java.time.LocalDate end = start.plusDays(days - 1);
                    defaultDep.setEndDate(end.toString());
                    defaultDep.setTotalDays(days);
                } catch (Exception e) {
                    defaultDep.setEndDate(tour.getDepartureDate());
                    defaultDep.setTotalDays(1);
                }

                defaultDep.setPrice(tour.getPrice() != null ? tour.getPrice() : 0);
                defaultDep.setMaxSlots(tour.getMaxSlots() != null ? tour.getMaxSlots() : 0);
                defaultDep.setAvailableSlots(tour.getMaxSlots() != null ? tour.getMaxSlots() : 0);
                defaultDep.setStatus("active");
                defaultDep.setNote("Ngày khởi hành mặc định");

                tour.setDepartures(new java.util.ArrayList<>(
                        java.util.List.of(defaultDep)
                ));
            }
        }

        return tourRepository.save(tour);
    }

    private int extractDays(String duration) {
        if (duration == null) return 1;
        try {
            // Lấy số đầu tiên trong chuỗi
            String[] parts = duration.trim().split(" ");
            return Integer.parseInt(parts[0]);
        } catch (Exception e) {
            return 1;
        }
    }

    public List<Tour> getToursByLocationId(String locationId) {
        return tourRepository.findByLocationIdsContaining(locationId);
    }

    public Tour updateTour(String id, Tour tourDetails) {
        Optional<Tour> tourOptional = tourRepository.findById(id);
        if (tourOptional.isPresent()) {
            Tour existing = tourOptional.get();
            existing.setName(tourDetails.getName());
            existing.setNameEn(tourDetails.getNameEn());
            existing.setLocationIds(tourDetails.getLocationIds());
            existing.setPrice(tourDetails.getPrice());
            existing.setDuration(tourDetails.getDuration());
            existing.setItinerary(tourDetails.getItinerary());
            existing.setItineraryEn(tourDetails.getItineraryEn());
            existing.setMaxSlots(tourDetails.getMaxSlots());
            existing.setImages(tourDetails.getImages());
            existing.setStatus(tourDetails.getStatus());
            existing.setIsApproved(tourDetails.getIsApproved());
            return tourRepository.save(existing);

        }
        return null;
    }

    public Tour rejectTour(String id) {
        Tour tour = tourRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Tour!"));
        tour.setIsApproved(false);
        tour.setIsRejected(true);
        Tour saved = tourRepository.save(tour);

        if (meilisearchService != null) {
            try {
                meilisearchService.deleteDocument("tours", id);
            } catch (Exception e) {
                System.err.println("⚠️ Meili delete skip: " + e.getMessage());
            }
        }
        return saved;
    }

    public void deleteTour(String tourId) {
        Tour tour = tourRepository.findById(tourId).orElse(null);
        if (tour != null) {

            tour.setStatus("inactive");
            tourRepository.save(tour);
        }
    }

    public List<Tour> getToursByAuthor(String email) {
        return tourRepository.findByAuthor(email);
    }

    public void authorDeleteTour(String id, String authorEmail) {
        Optional<Tour> tourOpt = tourRepository.findById(id);
        if (tourOpt.isPresent()) {
            Tour tour = tourOpt.get();
            // Kiểm tra xem đúng tác giả không
            if (!tour.getAuthor().equals(authorEmail)) {
                throw new RuntimeException("Bạn không có quyền xóa Tour này!");
            }
            // Đã duyệt hoặc đã bị Admin xóa mềm thì không cho tự xóa nữa
            if (tour.getIsApproved() || (tour.getIsRejected() != null && tour.getIsRejected())) {
                throw new RuntimeException("Tour này đã được xử lý, không thể xóa!");
            }
            tourRepository.delete(tour); // Xóa vĩnh viễn (Hard delete)
        } else {
            throw new RuntimeException("Không tìm thấy Tour!");
        }
    }


}