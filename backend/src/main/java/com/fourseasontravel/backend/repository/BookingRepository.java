package com.fourseasontravel.backend.repository;

import com.fourseasontravel.backend.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByStatus(String status);
    List<Booking> findByTourId(String tourId);
    List<Booking> findByTourIdAndStatus(String tourId, String status);
    List<Booking> findByCustomerEmail(String email);
    boolean existsByTourIdAndCustomerEmailAndStatusIn(
        String tourId, String email, List<String> statuses);
    List<Booking> findByCustomerEmailAndStatusIn(String customerEmail, List<String> statuses);
}