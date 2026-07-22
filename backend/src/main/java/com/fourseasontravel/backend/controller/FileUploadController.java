package com.fourseasontravel.backend.controller;

import com.fourseasontravel.backend.service.FileUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;


import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@Tag(name = "Upload", description = "Quản lý tải lên hình ảnh và tệp tin lên máy chủ lưu trữ Cloudinary")
@RestController // QUAN TRỌNG: Phải có chữ này Java mới biết đây là API
@RequestMapping("/api/v1/upload") // QUAN TRỌNG: Đường dẫn gốc
public class FileUploadController {

    @Autowired
    private FileUploadService fileUploadService;


    @Operation(summary = "Tải lên hình ảnh đơn lẻ",
            description = "Nhận tệp tin định dạng hình ảnh (MultipartFile) từ thiết bị của người dùng, tiến hành tải lên Cloudinary và trả về đường dẫn URL lưu trữ công khai.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tải lên hình ảnh thành công và trả về URL"),
            @ApiResponse(responseCode = "400", description = "Tệp tin không đúng định dạng hình ảnh, kích thước vượt quá giới hạn hoặc lỗi lưu trữ")
    })
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