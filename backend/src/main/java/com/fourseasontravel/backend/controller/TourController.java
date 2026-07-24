package com.fourseasontravel.backend.controller;

import com.fourseasontravel.backend.dto.TourResponseDTO;
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
import java.util.stream.Collectors;

import org.springframework.security.core.context.SecurityContextHolder;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@Tag(name = "Tours", description = "Quản lý Tour du lịch (Thông tin, phê duyệt, lịch khởi hành)")
@RestController
@RequestMapping("/api/v1/tours")
public class TourController {

    @Autowired
    private TourService tourService;

    @Autowired
    private SearchService searchService;

    @Autowired  // ← THÊM DÒNG NÀY
    private com.fourseasontravel.backend.repository.TourRepository tourRepository;


    @Operation(summary = "Lấy tất cả các tour đang hoạt động", description = "Trả về danh sách các tour du lịch đã được phê duyệt (isApproved = true) và đang mở bán.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công")
    })
    @GetMapping
    public ResponseEntity<List<TourResponseDTO>> getAll() {
        return ResponseEntity.ok(
                tourService.getAllTours().stream()
                        .map(TourResponseDTO::from)
                        .collect(Collectors.toList())
        );
    }


    @Operation(summary = "Lấy chi tiết tour theo ID", description = "Tìm kiếm và trả về thông tin chi tiết của một tour du lịch cụ thể bằng ID.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tìm thấy thông tin chi tiết tour"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy tour với ID đã cung cấp")
    })
    @GetMapping("/{id}")
    public ResponseEntity<Tour> getById(@PathVariable String id) {
        Optional<Tour> tour = tourService.getTourById(id);
        return tour.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }


    @Operation(summary = "Lấy danh sách tour theo Địa điểm", description = "Trả về danh sách các tour du lịch đi qua địa điểm cụ thể bằng ID địa điểm.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công")
    })
    @GetMapping("/location/{locationId}")
    public ResponseEntity<List<TourResponseDTO>> getToursByLocation(@PathVariable String locationId) {
        return ResponseEntity.ok(tourService.getToursByLocationId(locationId).stream()
                .map(TourResponseDTO::from)
                .collect(Collectors.toList()));
    }


    @Operation(summary = "Tạo tour du lịch mới", description = "Cho phép Author hoặc Admin tạo một tour du lịch mới. Trạng thái ban đầu sẽ là chờ duyệt (isApproved = false).")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Tạo tour thành công và chờ phê duyệt"),
            @ApiResponse(responseCode = "401", description = "Chưa đăng nhập / Token không hợp lệ"),
            @ApiResponse(responseCode = "403", description = "Không có quyền thực hiện hành động này")
    })
    @PostMapping
    public ResponseEntity<Tour> create(@RequestBody Tour tour) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return new ResponseEntity<>(tourService.createTour(tour, email), HttpStatus.CREATED);
    }


    @Operation(summary = "Cập nhật thông tin tour", description = "Cập nhật các thông tin chi tiết của tour du lịch đã tồn tại.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cập nhật thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy tour cần cập nhật")
    })
    @PutMapping("/{id}")
    public ResponseEntity<Tour> update(@PathVariable String id, @RequestBody Tour tour) {
        Tour updated = tourService.updateTour(id, tour);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }


    @Operation(summary = "Ngưng hoạt động tour (Xóa mềm)", description = "Chuyển trạng thái tour thành ngưng hoạt động bằng ID.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ngưng hoạt động tour thành công"),
            @ApiResponse(responseCode = "400", description = "Lỗi xảy ra trong quá trình xử lý")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTour(@PathVariable String id) {
        try {
            tourService.deleteTour(id);
            return ResponseEntity.ok().body("Đã ngưng hoạt động tour !");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi khi xóa tour: " + e.getMessage());
        }
    }


    @Operation(summary = "Lấy danh sách tour chờ duyệt", description = "Dành riêng cho Admin để lấy danh sách toàn bộ các tour mới được tạo đang chờ phê duyệt.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "403", description = "Chỉ Admin mới có quyền truy cập")
    })
    // API Lấy Tour chờ duyệt
    @GetMapping("/pending")
    public ResponseEntity<List<TourResponseDTO>> getPendingTours() {
        return ResponseEntity.ok(tourService.getPendingTours().stream()
                .map(TourResponseDTO::from)
                .collect(Collectors.toList()));
    }


    @Operation(summary = "Lấy danh sách tour của chính tôi", description = "Trả về danh sách tất cả các tour du lịch do chính tài khoản (Author/Admin) đang đăng nhập tạo ra.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "41" , description = "Chưa đăng nhập")
    })
    @GetMapping("/my-tours")
    public ResponseEntity<List<TourResponseDTO>> getMyTours() {
        // Lấy email người dùng đang đăng nhập từ Token
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(tourService.getToursByAuthor(email).stream()
                .map(TourResponseDTO::from)
                .collect(Collectors.toList()));
    }


    @Operation(summary = "Lấy danh sách tour đã duyệt để quản lý", description = "Dành cho Admin để theo dõi tất cả các tour đã được kích hoạt mở bán công khai.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công")
    })
    // Lấy danh sách Tour ĐÃ DUYỆT để Admin xem và có thể Xóa
    @GetMapping("/approved")
    public ResponseEntity<List<TourResponseDTO>> getApprovedTours() {
        return ResponseEntity.ok(
                tourService.getAllTours().stream()
                        .map(TourResponseDTO::from)
                        .collect(Collectors.toList())
        );
    }


    @Operation(summary = "Lấy toàn bộ tour cho giao diện Admin", description = "Trả về tất cả các tour trong hệ thống bao gồm cả các tour đã ngưng hoạt động hoặc hết chỗ.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công")
    })
    // Admin xem tất cả tour kể cả hết chỗ
    @GetMapping("/admin/all")
    public ResponseEntity<List<TourResponseDTO>> getAllForAdmin() {
        return ResponseEntity.ok(tourService.getAllToursForAdmin().stream()
                .map(TourResponseDTO::from)
                .collect(Collectors.toList()));
    }


    @Operation(summary = "Từ chối phê duyệt tour", description = "Admin từ chối duyệt bài đăng tour mới của tác giả và chuyển trạng thái thành Bị từ chối (isRejected = true).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Từ chối duyệt bài đăng thành công"),
            @ApiResponse(responseCode = "400", description = "Lỗi khi xử lý từ chối")
    })
    // Từ chối / Xóa Tour
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectTour(@PathVariable String id) {
        try {
            return ResponseEntity.ok(tourService.rejectTour(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @Operation(summary = "Phê duyệt cho phép tour hoạt động", description = "Admin phê duyệt bài đăng của tác giả để chính thức mở bán tour công khai trên hệ thống.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Duyệt tour thành công"),
            @ApiResponse(responseCode = "400", description = "Lỗi khi xử lý phê duyệt")
    })
    // API Duyệt Tour (Sử dụng PUT hoặc PATCH)
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveTour(@PathVariable String id) {
        try {
            return ResponseEntity.ok(tourService.approveTour(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @Operation(summary = "Tác giả tự xóa bản nháp của mình", description = "Cho phép tác giả tự xóa các bài đăng tour của chính mình khi vẫn còn ở trạng thái nháp (Chưa được Admin duyệt xử lý).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Xóa bản nháp thành công"),
            @ApiResponse(responseCode = "400", description = "Tour đã được duyệt hoặc từ chối, không thể tự xóa")
    })
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


    @Operation(summary = "Lấy danh sách các ngày khởi hành (Departures)", description = "Trả về toàn bộ danh sách các ngày khởi hành cụ thể kèm giá và số chỗ của một tour du lịch.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy tour")
    })
    // Lấy danh sách departures của 1 tour
    @GetMapping("/{id}/departures")
    public ResponseEntity<?> getDepartures(@PathVariable String id) {
        return tourRepository.findById(id)
                .map(t -> ResponseEntity.ok(t.getDepartures() != null
                        ? t.getDepartures() : List.of()))
                .orElse(ResponseEntity.notFound().build());
    }


    @Operation(summary = "Thêm ngày khởi hành mới cho tour", description = "Tác giả hoặc Admin thêm một ngày khởi hành mới vào danh sách lịch trình hoạt động của tour.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Thêm ngày khởi hành thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy tour")
    })
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


    @Operation(summary = "Cập nhật ngày khởi hành cụ thể", description = "Sửa thông tin của một ngày khởi hành (Thay đổi giá, số chỗ tối đa, lưu ý...).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cập nhật ngày khởi hành thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy tour hoặc ngày khởi hành")
    })
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


    @Operation(summary = "Tạm ngưng / Kích hoạt lại ngày khởi hành", description = "Đảo trạng thái hoạt động của ngày khởi hành giữa active (hoạt động) và suspended (tạm ngưng).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Thay đổi trạng thái thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy thông tin")
    })
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


    @Operation(summary = "Xóa ngày khởi hành cụ thể", description = "Gỡ bỏ hoàn toàn một ngày khởi hành khỏi lịch trình hoạt động của tour.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Xóa ngày khởi hành thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy thông tin")
    })
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
