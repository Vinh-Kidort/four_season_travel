package com.fourseasontravel.backend.repository;

import com.fourseasontravel.backend.model.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ReviewRepository extends MongoRepository<Review, String> {
    List<Review> findByItemIdOrderByCreatedAtDesc(String itemId);

    // Kiểm tra xem User này đã từng đánh giá (có sao) cho Item này chưa
    boolean existsByItemIdAndUserEmailAndRatingGreaterThan(String itemId, String userEmail, Integer rating);

    // Lấy tất cả đánh giá có sao của một Item để tính trung bình
    List<Review> findByItemIdAndRatingGreaterThan(String itemId, Integer rating);
}