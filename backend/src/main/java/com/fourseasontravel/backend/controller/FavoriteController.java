package com.fourseasontravel.backend.controller;

import com.fourseasontravel.backend.model.Article;
import com.fourseasontravel.backend.model.Favorite;
import com.fourseasontravel.backend.model.Tour;
import com.fourseasontravel.backend.repository.ArticleRepository;
import com.fourseasontravel.backend.repository.FavoriteRepository;
import com.fourseasontravel.backend.repository.LocationRepository;
import com.fourseasontravel.backend.repository.TourRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteRepository favoriteRepository;
    private final TourRepository tourRepository;
    private final LocationRepository locationRepository;
    private final ArticleRepository articleRepository;

    // Lấy userId từ JWT (email làm key)
    private String getCurrentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    // Toggle: nếu đã thích thì bỏ, chưa thích thì thêm
    @PostMapping("/toggle")
    public ResponseEntity<?> toggle(@RequestBody Map<String, String> body) {
        String userId = getCurrentUserId();
        String itemId = body.get("itemId");
        String itemType = body.get("itemType"); // TOUR | LOCATION | ARTICLE

        Optional<Favorite> existing = favoriteRepository
                .findByUserIdAndItemIdAndItemType(userId, itemId, itemType);

        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            return ResponseEntity.ok(Map.of("favorited", false));
        } else {
            Favorite fav = Favorite.builder()
                    .userId(userId)
                    .itemId(itemId)
                    .itemType(itemType)
                    .createdAt(LocalDateTime.now())
                    .build();
            favoriteRepository.save(fav);
            return ResponseEntity.ok(Map.of("favorited", true));
        }
    }

    // Lấy toàn bộ favorites của user, kèm data đầy đủ
    @GetMapping
    public ResponseEntity<?> getMyFavorites() {
        String userId = getCurrentUserId();
        List<Favorite> favs = favoriteRepository.findByUserId(userId);

        List<Map<String, Object>> result = favs.stream().map(fav -> {
            Map<String, Object> item = new HashMap<>();
            item.put("favoriteId", fav.getId());
            item.put("itemType", fav.getItemType());
            item.put("createdAt", fav.getCreatedAt());

            switch (fav.getItemType()) {
                case "TOUR" -> tourRepository.findById(fav.getItemId())
                        .ifPresent(t -> item.put("data", t));
                case "LOCATION" -> locationRepository.findById(fav.getItemId())
                        .ifPresent(l -> item.put("data", l));
                case "ARTICLE" -> articleRepository.findById(fav.getItemId())
                        .ifPresent(a -> item.put("data", a));
            }
            return item;
                }).filter(m -> m.containsKey("data"))
                .map(m -> {
                    if ("TOUR".equals(m.get("itemType"))) {
                        Tour tour = (Tour) m.get("data");
                        boolean active = Boolean.TRUE.equals(tour.getIsApproved())
                                && !Boolean.TRUE.equals(tour.getIsRejected());
                        m.put("isActive", active);
                    } else if ("ARTICLE".equals(m.get("itemType"))) {
                        Article article = (Article) m.get("data");
                        boolean active = Boolean.TRUE.equals(article.getIsApproved())
                                && !Boolean.TRUE.equals(article.getIsRejected());
                        m.put("isActive", active);
                    } else {
                        m.put("isActive", true); // Location không có isApproved/isRejected
                    }
                    return m;
                }).toList();

        return ResponseEntity.ok(result);
    }

    // Kiểm tra một item có được yêu thích không
    @GetMapping("/check")
    public ResponseEntity<?> check(@RequestParam String itemId, @RequestParam String itemType) {
        String userId = getCurrentUserId();
        boolean favorited = favoriteRepository.existsByUserIdAndItemIdAndItemType(userId, itemId, itemType);
        return ResponseEntity.ok(Map.of("favorited", favorited));
    }
}
