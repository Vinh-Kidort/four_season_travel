package com.fourseasontravel.backend.controller;

import com.fourseasontravel.backend.model.Location;
import com.fourseasontravel.backend.service.LocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/locations")
public class LocationController {

    @Autowired
    private LocationService locationService;

    // API Lấy danh sách (GET /api/v1/locations)
    @GetMapping
    public ResponseEntity<List<Location>> getAllLocations() {
        return new ResponseEntity<>(locationService.getAllLocations(), HttpStatus.OK);
    }

    // API Lấy chi tiết 1 địa điểm (GET /api/v1/locations/{id})
    @GetMapping("/{id}")
    public ResponseEntity<Location> getLocationById(@PathVariable String id) {
        Optional<Location> location = locationService.getLocationById(id);
        return location.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // API Thêm mới (POST /api/v1/locations)
    @PostMapping
    public ResponseEntity<Location> createLocation(@RequestBody Location location) {
        Location createdLocation = locationService.createLocation(location);
        return new ResponseEntity<>(createdLocation, HttpStatus.CREATED);
    }

    // API Cập nhật (PUT /api/v1/locations/{id})
    @PutMapping("/{id}")
    public ResponseEntity<Location> updateLocation(@PathVariable String id, @RequestBody Location location) {
        Location updatedLocation = locationService.updateLocation(id, location);
        if (updatedLocation != null) {
            return new ResponseEntity<>(updatedLocation, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    // API Xóa (DELETE /api/v1/locations/{id})
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLocation(@PathVariable String id) {
        locationService.deleteLocation(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}