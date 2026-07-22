package com.fourseasontravel.backend.controller;

import com.fourseasontravel.backend.service.MeilisearchService;
import com.fourseasontravel.backend.service.SearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.Parameter;

@Tag(name = "Search", description = "Quản lý Tìm kiếm (Tours, Địa điểm, Cẩm nang) và Đồng bộ chỉ mục Meilisearch")
@RestController
@RequestMapping("/api/v1/search")
public class SearchController {

    @Autowired
    private SearchService searchService;


    // 2. CÁC HÀM SYNC RIÊNG CỦA MEILISEARCH (Có thể bị null nếu tắt Meili)
    @Autowired(required = false)
    private MeilisearchService meilisearchService;


    @Operation(summary = "Tìm kiếm tích hợp đa năng (Tours, Địa điểm, Cẩm nang)",
            description = "Thực hiện tìm kiếm thông tin toàn cục trên toàn bộ hệ thống dựa trên từ khóa và ngày khởi hành mong muốn. Hỗ trợ tự động chuyển đổi linh hoạt giữa Meilisearch nội bộ hoặc MongoDB Atlas Search đám mây.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Thực hiện tìm kiếm thành công")
    })
    // ── TÌM KIẾM ──────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<Map<String, Object>> search(
            @Parameter(description = "Từ khóa tìm kiếm (Tên tour, địa danh, ẩm thực, thẻ tags...)", required = true, example = "Hội An")
            @RequestParam String keyword,
            @Parameter(description = "Ngày khởi hành mong muốn (định dạng yyyy-MM-dd)", required = false, example = "2026-06-30")
            @RequestParam(required = false) String date) {

        // Gọi qua Interface, không cần quan tâm đang dùng cái nào
        return ResponseEntity.ok(searchService.search(keyword, date));
    }


    // ── CÁC HÀM ĐỒNG BỘ CỦA MEILISEARCH ─────────────────────────
    // Atlas Search lấy data trực tiếp từ MongoDB nên KHÔNG CẦN Sync.


    @Operation(summary = "Đồng bộ toàn bộ dữ liệu lên Meilisearch (Admin)",
            description = "Đẩy thủ công toàn bộ dữ liệu (Tours, Địa điểm, Cẩm nang) từ MongoDB lên bộ chỉ mục của Meilisearch. (Tác vụ này sẽ tự động bỏ qua nếu hệ thống đang được cấu hình sử dụng Atlas Search).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Đồng bộ hóa thành công hoặc tự động bỏ qua")
    })
    @PostMapping("/sync")
    public ResponseEntity<String> syncAll() {
        if (meilisearchService == null) {
            return ResponseEntity.ok("ℹ️ Hệ thống đang dùng Atlas Search. Không cần đồng bộ thủ công!");
        }
        meilisearchService.syncAll();
        return ResponseEntity.ok("✅ Sync hoàn tất!");
    }


    @Operation(summary = "Đồng bộ dữ liệu Tours lên Meilisearch (Admin)",
            description = "Đẩy riêng danh mục Tour du lịch từ MongoDB lên Meilisearch.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Đồng bộ hóa Tours thành công")
    })
    @PostMapping("/sync/tours")
    public ResponseEntity<String> syncTours() {
        if (meilisearchService == null) {
            return ResponseEntity.ok("ℹ️ Hệ thống đang dùng Atlas Search. Không cần đồng bộ!");
        }
        meilisearchService.syncTours();
        return ResponseEntity.ok("✅ Sync tours hoàn tất!");
    }


    @Operation(summary = "Đồng bộ dữ liệu Cẩm nang lên Meilisearch (Admin)",
            description = "Đẩy riêng danh mục các bài viết Cẩm nang du lịch lên Meilisearch.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Đồng bộ hóa Cẩm nang thành công")
    })
    @PostMapping("/sync/articles")
    public ResponseEntity<String> syncArticles() {
        if (meilisearchService == null) {
            return ResponseEntity.ok("ℹ️ Hệ thống đang dùng Atlas Search. Không cần đồng bộ!");
        }
        meilisearchService.syncArticles();
        return ResponseEntity.ok("✅ Sync articles hoàn tất!");
    }


    @Operation(summary = "Đồng bộ dữ liệu Địa điểm lên Meilisearch (Admin)",
            description = "Đẩy riêng danh mục các Địa điểm du lịch lên Meilisearch.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Đồng bộ hóa Địa điểm thành công")
    })
    @PostMapping("/sync/locations")
    public ResponseEntity<String> syncLocations() {
        if (meilisearchService == null) {
            return ResponseEntity.ok("ℹ️ Hệ thống đang dùng Atlas Search. Không cần đồng bộ!");
        }
        meilisearchService.syncLocations();
        return ResponseEntity.ok("✅ Sync locations hoàn tất!");
    }


    @Operation(summary = "Xóa trắng bộ chỉ mục và đồng bộ lại từ đầu (Admin)",
            description = "Thực hiện dọn dẹp (Clear) sạch toàn bộ indexes hiện có trên máy chủ Meilisearch và tái đồng bộ hóa lại toàn bộ cơ sở dữ liệu từ MongoDB.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Reset và tái đồng bộ hoàn tất"),
            @ApiResponse(responseCode = "500", description = "Lỗi hệ thống hoặc mất kết nối với máy chủ Meilisearch")
    })
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