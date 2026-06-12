package com.fourseasontravel.backend.controller;

import com.fourseasontravel.backend.model.Article;
import com.fourseasontravel.backend.model.Location;
import com.fourseasontravel.backend.model.Review;
import com.fourseasontravel.backend.model.Tour;
import com.fourseasontravel.backend.repository.ArticleRepository;
import com.fourseasontravel.backend.repository.LocationRepository;
import com.fourseasontravel.backend.repository.ReviewRepository;
import com.fourseasontravel.backend.repository.TourRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {

    @Autowired private ReviewRepository reviewRepository;
    @Autowired private LocationRepository locationRepository;
    @Autowired private ArticleRepository articleRepository;
    @Autowired private TourRepository tourRepository;

    // 1. Lấy danh sách Comment của 1 địa điểm/bài viết
    @GetMapping("/{itemId}")
    public ResponseEntity<List<Review>> getReviews(@PathVariable String itemId) {
        return ResponseEntity.ok(reviewRepository.findByItemIdOrderByCreatedAtDesc(itemId));
    }

    // 2. Viết Comment & Đánh giá
    @PostMapping
    public ResponseEntity<?> addReview(@RequestBody Review review) {
        // Kiểm tra xem có đánh giá Sao không? (rating > 0)
        if (review.getRating() != null && review.getRating() > 0) {
            // Nếu có sao, kiểm tra xem đã từng đánh giá chưa (Luật: 1 user - 1 lần đánh giá sao)
            boolean alreadyRated = reviewRepository.existsByItemIdAndUserEmailAndRatingGreaterThan(review.getItemId(), review.getUserEmail(), 0);
            if (alreadyRated) {
                return ResponseEntity.badRequest().body("Bạn đã đánh giá sao cho nội dung này rồi! (Vẫn có thể comment không kèm sao).");
            }
        } else {
            review.setRating(0); // Không đánh giá sao
        }


        review.setCreatedAt(LocalDate.now().toString());
        reviewRepository.save(review);

        // NẾU CÓ SAO -> TÍNH TOÁN LẠI ĐIỂM TRUNG BÌNH CHO LOCATION HOẶC ARTICLE
        if (review.getRating() > 0) {
            List<Review> allRatedReviews = reviewRepository.findByItemIdAndRatingGreaterThan(review.getItemId(), 0);
            double avg = allRatedReviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
            avg = Math.round(avg * 10.0) / 10.0; // Làm tròn 1 chữ số thập phân (VD: 4.5)
            int count = allRatedReviews.size();

            if (review.getItemType().equals("LOCATION")) {
                Location loc = locationRepository.findById(review.getItemId()).orElse(null);
                if (loc != null) { loc.setAverageRating(avg); loc.setReviewCount(count); locationRepository.save(loc); }
            } else if (review.getItemType().equals("ARTICLE")) {
                Article art = articleRepository.findById(review.getItemId()).orElse(null);
                if (art != null) { art.setAverageRating(avg); art.setReviewCount(count); articleRepository.save(art); }
            }else if (review.getItemType().equals("TOUR")) {
                Tour tour = tourRepository.findById(review.getItemId()).orElse(null);
                if (tour != null) { tour.setAverageRating(avg); tour.setReviewCount(count); tourRepository.save(tour); }
            }
        }
        return ResponseEntity.ok(review);
    }
}