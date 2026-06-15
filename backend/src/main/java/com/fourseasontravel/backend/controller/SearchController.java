package com.fourseasontravel.backend.controller;

import com.fourseasontravel.backend.service.MeilisearchService;
import com.fourseasontravel.backend.service.SearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.Map;

@RestController
@RequestMapping("/api/v1/search")
public class SearchController {

    @Autowired
    private SearchService searchService;


    // 2. CÁC HÀM SYNC RIÊNG CỦA MEILISEARCH (Có thể bị null nếu tắt Meili)
    @Autowired(required = false)
    private MeilisearchService meilisearchService;


    // ── TÌM KIẾM ──────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<Map<String, Object>> search(
            @RequestParam String keyword,
            @RequestParam(required = false) String date) {

        // Gọi qua Interface, không cần quan tâm đang dùng cái nào
        return ResponseEntity.ok(searchService.search(keyword, date));
    }


    // ── CÁC HÀM ĐỒNG BỘ CỦA MEILISEARCH ─────────────────────────
    // Atlas Search lấy data trực tiếp từ MongoDB nên KHÔNG CẦN Sync.

    @PostMapping("/sync")
    public ResponseEntity<String> syncAll() {
        if (meilisearchService == null) {
            return ResponseEntity.ok("ℹ️ Hệ thống đang dùng Atlas Search. Không cần đồng bộ thủ công!");
        }
        meilisearchService.syncAll();
        return ResponseEntity.ok("✅ Sync hoàn tất!");
    }

    @PostMapping("/sync/tours")
    public ResponseEntity<String> syncTours() {
        if (meilisearchService == null) {
            return ResponseEntity.ok("ℹ️ Hệ thống đang dùng Atlas Search. Không cần đồng bộ!");
        }
        meilisearchService.syncTours();
        return ResponseEntity.ok("✅ Sync tours hoàn tất!");
    }

    @PostMapping("/sync/articles")
    public ResponseEntity<String> syncArticles() {
        if (meilisearchService == null) {
            return ResponseEntity.ok("ℹ️ Hệ thống đang dùng Atlas Search. Không cần đồng bộ!");
        }
        meilisearchService.syncArticles();
        return ResponseEntity.ok("✅ Sync articles hoàn tất!");
    }

    @PostMapping("/sync/locations")
    public ResponseEntity<String> syncLocations() {
        if (meilisearchService == null) {
            return ResponseEntity.ok("ℹ️ Hệ thống đang dùng Atlas Search. Không cần đồng bộ!");
        }
        meilisearchService.syncLocations();
        return ResponseEntity.ok("✅ Sync locations hoàn tất!");
    }

    @PostMapping("/sync/reset")
    public ResponseEntity<String> resetAndSync() {
        if (meilisearchService == null) {
            return ResponseEntity.ok(
                    "ℹ️ Hệ thống đang dùng Atlas Search. Không cần reset index!");
        }
        try {
            meilisearchService.resetAllIndexes();
            meilisearchService.syncAll();
            return ResponseEntity.ok("✅ Reset và sync hoàn tất!");
        } catch (Exception e) {
            return ResponseEntity.status(500)  // ← đổi badRequest → 500 cho đúng
                    .body("❌ Lỗi: " + e.getMessage());
        }
    }
}