package com.fourseasontravel.backend.service;

import com.fourseasontravel.backend.model.Location;
import com.fourseasontravel.backend.repository.LocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LocationService {

    @Autowired // Tự động "tiêm" LocationRepository vào đây để dùng
    private LocationRepository locationRepository;

    // 1. READ: Lấy tất cả địa điểm
    public List<Location> getAllLocations() {
        return locationRepository.findAll();
    }

    // 2. READ: Lấy 1 địa điểm theo ID
    public Optional<Location> getLocationById(String id) {
        return locationRepository.findById(id);
    }

    // 3. CREATE: Thêm mới 1 địa điểm
    public Location createLocation(Location location) {
        return locationRepository.save(location);
    }

    // 4. UPDATE: Cập nhật địa điểm
    public Location updateLocation(String id, Location locationDetails) {
        Optional<Location> locationOptional = locationRepository.findById(id);

        if (locationOptional.isPresent()) {
            Location existingLocation = locationOptional.get();
            existingLocation.setName(locationDetails.getName());
            existingLocation.setDescription(locationDetails.getDescription());
            existingLocation.setImages(locationDetails.getImages());
            existingLocation.setRegion(locationDetails.getRegion());
            existingLocation.setBestSeason(locationDetails.getBestSeason());

            return locationRepository.save(existingLocation);
        }
        return null; // Thực tế nên ném ra một Exception (Lỗi), nhưng để đơn giản ta return null
    }

    // 5. DELETE: Xóa địa điểm
    public void deleteLocation(String id) {
        locationRepository.deleteById(id);
    }
}