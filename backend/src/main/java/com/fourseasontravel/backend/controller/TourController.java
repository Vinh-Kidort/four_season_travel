package com.fourseasontravel.backend.controller;

import com.fourseasontravel.backend.model.Tour;
import com.fourseasontravel.backend.service.SearchService;
import com.fourseasontravel.backend.service.TourService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/api/v1/tours")
public class TourController {

    @Autowired
    private TourService tourService;

    @Autowired
    private SearchService searchService;

    @Autowired  // ← THÊM DÒNG NÀY
    private com.fourseasontravel.backend.repository.TourRepository tourRepository;

    @GetMapping
    public ResponseEntity<List<Tour>> getAll() {
        return ResponseEntity.ok(tourService.getAllTours());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tour> getById(@PathVariable String id) {
        Optional<Tour> tour = tourService.getTourById(id);
        return tour.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }



    @GetMapping("/location/{locationId}")
    public ResponseEntity<List<Tour>> getToursByLocation(@PathVariable String locationId) {
        return ResponseEntity.ok(tourService.getToursByLocationId(locationId));
    }

    @PostMapping
    public ResponseEntity<Tour> create(@RequestBody Tour tour) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return new ResponseEntity<>(tourService.createTour(tour, email), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tour> update(@PathVariable String id, @RequestBody Tour tour) {
        Tour updated = tourService.updateTour(id, tour);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTour(@PathVariable String id) {
        try {
            tourService.deleteTour(id);
            return ResponseEntity.ok().body("Đã ngưng hoạt động tour !");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi khi xóa tour: " + e.getMessage());
        }
    }

    // API Lấy Tour chờ duyệt
    @GetMapping("/pending")
    public ResponseEntity<List<Tour>> getPendingTours() {
        return ResponseEntity.ok(tourService.getPendingTours());
    }

    @GetMapping("/my-tours")
    public ResponseEntity<List<Tour>> getMyTours() {
        // Lấy email người dùng đang đăng nhập từ Token
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(tourService.getToursByAuthor(email));
    }

    // Lấy danh sách Tour ĐÃ DUYỆT để Admin xem và có thể Xóa
    @GetMapping("/approved")
    public ResponseEntity<List<Tour>> getApprovedTours() {
        return ResponseEntity.ok(tourService.getAllTours()); // Gọi lại hàm getAll cũ
    }

    // Admin xem tất cả tour kể cả hết chỗ
    @GetMapping("/admin/all")
    public ResponseEntity<List<Tour>> getAllForAdmin() {
        return ResponseEntity.ok(tourService.getAllToursForAdmin());
    }

    // Từ chối / Xóa Tour
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectTour(@PathVariable String id) {
        try {
            return ResponseEntity.ok(tourService.rejectTour(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API Duyệt Tour (Sử dụng PUT hoặc PATCH)
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveTour(@PathVariable String id) {
        try {
            return ResponseEntity.ok(tourService.approveTour(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}/author-delete")
    public ResponseEntity<?> authorDeleteTour(@PathVariable String id) {
        try {
            // Lấy email người đang đăng nhập
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            tourService.authorDeleteTour(id, email);
            return ResponseEntity.ok("Đã xóa bản nháp thành công!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Lấy danh sách departures của 1 tour
    @GetMapping("/{id}/departures")
    public ResponseEntity<?> getDepartures(@PathVariable String id) {
        return tourRepository.findById(id)
                .map(t -> ResponseEntity.ok(t.getDepartures() != null
                        ? t.getDepartures() : List.of()))
                .orElse(ResponseEntity.notFound().build());
    }

    // Thêm departure mới
    @PostMapping("/{id}/departures")
    public ResponseEntity<?> addDeparture(
            @PathVariable String id,
            @RequestBody Tour.TourDeparture departure) {
        return tourRepository.findById(id).map(tour -> {
            if (tour.getDepartures() == null)
                tour.setDepartures(new ArrayList<>());

            // Sinh UUID cho departure
            departure.setId(java.util.UUID.randomUUID().toString().substring(0, 8));
            if (departure.getMaxSlots() != null) {
                departure.setAvailableSlots(departure.getMaxSlots());
            }
            if (departure.getStatus() == null) departure.setStatus("active");

            // Tính totalDays tự động nếu chưa nhập
            if ((departure.getTotalDays() == null || departure.getTotalDays() == 0) && departure.getStartDate() != null
                    && departure.getEndDate() != null) {
                try {
                    java.time.LocalDate start = java.time.LocalDate.parse(departure.getStartDate());
                    java.time.LocalDate end   = java.time.LocalDate.parse(departure.getEndDate());
                    departure.setTotalDays((int) java.time.temporal.ChronoUnit.DAYS.between(start, end) + 1);
                } catch (Exception ignored) {}
            }

            tour.getDepartures().add(departure);
            tourRepository.save(tour);
            return ResponseEntity.ok(tour.getDepartures());
        }).orElse(ResponseEntity.notFound().build());
    }

    // Cập nhật departure (sửa giá, status, note)
    @PutMapping("/{id}/departures/{depId}")
    public ResponseEntity<?> updateDeparture(
            @PathVariable String id,
            @PathVariable String depId,
            @RequestBody Tour.TourDeparture updated) {
        return tourRepository.findById(id).map(tour -> {
            if (tour.getDepartures() == null)
                return ResponseEntity.notFound().<Object>build();

            tour.getDepartures().replaceAll(dep -> {
                if (depId.equals(dep.getId())) {
                    updated.setId(depId);
                    // Giữ nguyên availableSlots nếu không thay đổi maxSlots
                    if (updated.getMaxSlots() != dep.getMaxSlots()) {
                        int diff = updated.getMaxSlots() - dep.getMaxSlots();
                        updated.setAvailableSlots(dep.getAvailableSlots() + diff);
                    } else {
                        updated.setAvailableSlots(dep.getAvailableSlots());
                    }
                    return updated;
                }
                return dep;
            });
            tourRepository.save(tour);
            return ResponseEntity.ok(tour.getDepartures());
        }).orElse(ResponseEntity.notFound().build());
    }

    // Tạm ngưng / kích hoạt lại departure
    @PutMapping("/{id}/departures/{depId}/toggle")
    public ResponseEntity<?> toggleDeparture(
            @PathVariable String id,
            @PathVariable String depId) {
        return tourRepository.findById(id).map(tour -> {
            if (tour.getDepartures() == null)
                return ResponseEntity.notFound().<Object>build();

            tour.getDepartures().replaceAll(dep -> {
                if (depId.equals(dep.getId())) {
                    dep.setStatus("active".equals(dep.getStatus()) ? "suspended" : "active");
                }
                return dep;
            });
            tourRepository.save(tour);
            return ResponseEntity.ok(tour.getDepartures());
        }).orElse(ResponseEntity.notFound().build());
    }

    // Xóa departure
    @DeleteMapping("/{id}/departures/{depId}")
    public ResponseEntity<?> deleteDeparture(
            @PathVariable String id,
            @PathVariable String depId) {
        return tourRepository.findById(id).map(tour -> {
            if (tour.getDepartures() != null)
                tour.getDepartures().removeIf(d -> depId.equals(d.getId()));
            tourRepository.save(tour);
            return ResponseEntity.ok("Đã xóa departure");
        }).orElse(ResponseEntity.notFound().build());
    }

}
