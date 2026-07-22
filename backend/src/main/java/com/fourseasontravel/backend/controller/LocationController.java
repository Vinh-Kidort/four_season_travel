package com.fourseasontravel.backend.controller;

import com.fourseasontravel.backend.model.Location;
import com.fourseasontravel.backend.service.LocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@Tag(name = "Locations", description = "Quản lý Địa điểm du lịch (Vùng miền, mùa đẹp nhất, mô tả)")
@RestController
@RequestMapping("/api/v1/locations")
public class LocationController {

    @Autowired
    private LocationService locationService;


    @Operation(summary = "Lấy danh sách tất cả các địa điểm", description = "Trả về toàn bộ danh sách địa điểm du lịch trong hệ thống bao gồm thông tin vùng miền, mô tả và hình ảnh.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công")
    })
    // API Lấy danh sách (GET /api/v1/locations)
    @GetMapping
    public ResponseEntity<List<Location>> getAllLocations() {
        return new ResponseEntity<>(locationService.getAllLocations(), HttpStatus.OK);
    }


    @Operation(summary = "Lấy chi tiết địa điểm theo ID", description = "Tìm kiếm và trả về thông tin chi tiết của một địa điểm du lịch cụ thể dựa trên ID.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tìm thấy thông tin chi tiết địa điểm"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy địa điểm với ID đã cung cấp")
    })
    // API Lấy chi tiết 1 địa điểm (GET /api/v1/locations/{id})
    @GetMapping("/{id}")
    public ResponseEntity<Location> getLocationById(@PathVariable String id) {
        Optional<Location> location = locationService.getLocationById(id);
        return location.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }


    @Operation(summary = "Thêm địa điểm du lịch mới", description = "Cho phép quản trị viên (Admin) khởi tạo thông tin cho một địa điểm du lịch mới.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Tạo địa điểm thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa đăng nhập / Token không hợp lệ"),
            @ApiResponse(responseCode = "403", description = "Không có quyền thực hiện (Yêu cầu tài khoản Admin)")
    })
    // API Thêm mới (POST /api/v1/locations)
    @PostMapping
    public ResponseEntity<Location> createLocation(@RequestBody Location location) {
        Location createdLocation = locationService.createLocation(location);
        return new ResponseEntity<>(createdLocation, HttpStatus.CREATED);
    }


    @Operation(summary = "Cập nhật thông tin địa điểm", description = "Chỉnh sửa các thông tin chi tiết (tên, vùng miền, mô tả, ảnh...) của một địa điểm du lịch sẵn có.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cập nhật thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa đăng nhập / Token không hợp lệ"),
            @ApiResponse(responseCode = "403", description = "Không có quyền thực hiện (Yêu cầu tài khoản Admin)"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy địa điểm cần cập nhật")
    })
    // API Cập nhật (PUT /api/v1/locations/{id})
    @PutMapping("/{id}")
    public ResponseEntity<Location> updateLocation(@PathVariable String id, @RequestBody Location location) {
        Location updatedLocation = locationService.updateLocation(id, location);
        if (updatedLocation != null) {
            return new ResponseEntity<>(updatedLocation, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }


    @Operation(summary = "Xóa địa điểm du lịch", description = "Gỡ bỏ hoàn toàn một địa điểm du lịch khỏi hệ thống và cơ sở dữ liệu bằng ID.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Xóa địa điểm thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa đăng nhập / Token không hợp lệ"),
            @ApiResponse(responseCode = "403", description = "Không có quyền thực hiện (Yêu cầu tài khoản Admin)"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy địa điểm cần xóa")
    })
    // API Xóa (DELETE /api/v1/locations/{id})
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLocation(@PathVariable String id) {
        locationService.deleteLocation(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}