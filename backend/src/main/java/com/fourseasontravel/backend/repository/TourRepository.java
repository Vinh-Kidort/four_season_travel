package com.fourseasontravel.backend.repository;

import com.fourseasontravel.backend.model.Tour;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import org.springframework.data.mongodb.repository.Aggregation;



@Repository
public interface TourRepository extends MongoRepository<Tour, String> {
    // Tự động tìm các Tour mà mảng locationIds có chứa cái locationId được truyền vào
    List<Tour> findByLocationIdsContaining(String locationId);
    List<Tour> findByIsApprovedTrue();  // Tìm tour đã duyệt (Cho khách)
    List<Tour> findByIsApprovedFalse(); // Tìm tour chưa duyệt (Cho Admin)

    // FIX: Chỉ lấy tour chờ duyệt THẬT SỰ (chưa approved VÀ chưa bị reject)
    List<Tour> findByIsApprovedFalseAndIsRejectedFalse();

    // Lấy tour đã bị reject (cho author xem)
    List<Tour> findByIsRejectedTrue();

    List<Tour> findByAuthor(String author);

    @Aggregation(pipeline = {
            "{ '$search': { 'index': 'default', 'text': { 'query': ?0, 'path': { 'wildcard': '*' } } } }",
            "{ '$limit': 20 }"
    })
    List<Tour> searchToursByKeyword(String keyword);
}