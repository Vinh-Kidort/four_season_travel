package com.fourseasontravel.backend.config;

import com.fourseasontravel.backend.service.MeilisearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class MeilisearchStartupSync {

    @Autowired
    @Lazy
    private MeilisearchService meilisearchService;

    // Tự động sync sau khi Spring Boot khởi động xong
    @EventListener(ApplicationReadyEvent.class)
    public void syncOnStartup() {
        // Chạy trong thread riêng để không block startup
        new Thread(() -> {
            try {
                Thread.sleep(2000); // Đợi 2 giây cho chắc
                System.out.println("🔄 Bắt đầu sync data lên Meilisearch...");
                meilisearchService.syncAll();
                System.out.println("✅ Sync Meilisearch hoàn tất!");
            } catch (Exception e) {
                System.err.println("⚠️ Meilisearch sync skipped: " + e.getMessage());
                System.err.println("→ Chạy meilisearch.exe trước rồi gọi POST /search/sync");
            }
        }, "meilisearch-sync").start();
    }
}