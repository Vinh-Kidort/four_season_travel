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


import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@Tag(name = "Favorites", description = "Quản lý mục Yêu thích (Thả tim cho Tour, Địa điểm, Cẩm nang của người dùng)")
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


    @Operation(summary = "Thêm / Bỏ yêu thích một mục (Tour, Địa điểm, Cẩm nang)",
            description = "Đảo trạng thái yêu thích (Toggle). Nếu mục này đã tồn tại trong danh sách yêu thích của người dùng, hệ thống sẽ tự động xóa đi (Bỏ tim - favorited: false). Nếu chưa có, hệ thống sẽ thêm mới vào danh sách yêu thích (Thả tim - favorited: true).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Xử lý thành công (Trả về trạng thái thả tim hiện tại)"),
            @ApiResponse(responseCode = "401", description = "Chưa đăng nhập hoặc Token không hợp lệ")
    })
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


    @Operation(summary = "Lấy toàn bộ danh sách yêu thích của cá nhân",
            description = "Truy vấn và trả về đầy đủ thông tin chi tiết các Tour, Địa điểm, Cẩm nang đã yêu thích của người dùng đang đăng nhập, đồng thời kiểm tra trạng thái hoạt động (isActive) của bài viết/tour đó.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách yêu thích thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa đăng nhập / Token không hợp lệ")
    })
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


    @Operation(summary = "Kiểm tra xem một mục cụ thể có đang được yêu thích hay không",
            description = "Kiểm tra trạng thái thả tim nhanh của một Tour, Địa điểm, hoặc Cẩm nang cụ thể bằng ID. Dùng để cập nhật biểu tượng Trái tim rỗng/đầy ở phía giao diện Frontend.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Kiểm tra thành công (Trả về true nếu đang thích, false nếu ngược lại)"),
            @ApiResponse(responseCode = "401", description = "Chưa đăng nhập")
    })
    // Kiểm tra một item có được yêu thích không
    @GetMapping("/check")
    public ResponseEntity<?> check(@RequestParam String itemId, @RequestParam String itemType) {
        String userId = getCurrentUserId();
        boolean favorited = favoriteRepository.existsByUserIdAndItemIdAndItemType(userId, itemId, itemType);
        return ResponseEntity.ok(Map.of("favorited", favorited));
    }
}
