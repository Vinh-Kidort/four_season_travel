package com.fourseasontravel.backend.controller;

import com.fourseasontravel.backend.service.MeilisearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/search")
public class SearchController {

    @Autowired
    private MeilisearchService meilisearchService;

    // Tìm kiếm
    @GetMapping
    public ResponseEntity<Map<String, Object>> search(
            @RequestParam String keyword,
            @RequestParam(required = false) String date) {
        return ResponseEntity.ok(meilisearchService.search(keyword, date));
    }

    // Đồng bộ toàn bộ dữ liệu — gọi thủ công khi cần
    @PostMapping("/sync")
    public ResponseEntity<String> syncAll() {
        meilisearchService.syncAll();
        return ResponseEntity.ok("✅ Sync hoàn tất!");
    }

    // Đồng bộ riêng từng loại
    @PostMapping("/sync/tours")
    public ResponseEntity<String> syncTours() {
        meilisearchService.syncTours();
        return ResponseEntity.ok("✅ Sync tours hoàn tất!");
    }

    @PostMapping("/sync/articles")
    public ResponseEntity<String> syncArticles() {
        meilisearchService.syncArticles();
        return ResponseEntity.ok("✅ Sync articles hoàn tất!");
    }

    @PostMapping("/sync/locations")
    public ResponseEntity<String> syncLocations() {
        meilisearchService.syncLocations();
        return ResponseEntity.ok("✅ Sync locations hoàn tất!");
    }

    @PostMapping("/sync/reset")
    public ResponseEntity<String> resetAndSync() {
        try {
            // Xóa index cũ
            meilisearchService.resetAllIndexes();
            // Sync lại từ MongoDB
            meilisearchService.syncAll();
            return ResponseEntity.ok("✅ Reset và sync hoàn tất!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("❌ Lỗi: " + e.getMessage());
        }
    }
}