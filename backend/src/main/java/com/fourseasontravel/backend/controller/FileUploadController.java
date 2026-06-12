package com.fourseasontravel.backend.controller;

import com.fourseasontravel.backend.service.FileUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController // QUAN TRỌNG: Phải có chữ này Java mới biết đây là API
@RequestMapping("/api/v1/upload") // QUAN TRỌNG: Đường dẫn gốc
public class FileUploadController {

    @Autowired
    private FileUploadService fileUploadService;

    // QUAN TRỌNG: Kết hợp với đường gốc sẽ tạo thành /api/v1/upload/image
    @PostMapping("/image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = fileUploadService.uploadImage(file);
            Map<String, String> response = new HashMap<>();
            response.put("url", imageUrl);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi up ảnh: " + e.getMessage());
        }
    }
}