package com.fourseasontravel.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class FileUploadService {

    @Autowired
    private Cloudinary cloudinary;

    public String uploadImage(MultipartFile file) throws IOException {
        // Upload file lên Cloudinary, lưu vào folder "fourseasontravel"
        Map result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "fourseasontravel",
                        "resource_type", "image"
                )
        );
        // Trả về link ảnh
        return result.get("secure_url").toString();
    }

    public void deleteImage(String imageUrl) throws IOException {
        // Lấy public_id từ URL để xóa (dùng khi cần)
        String publicId = extractPublicId(imageUrl);
        cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }

    // Tách public_id từ URL Cloudinary
    private String extractPublicId(String imageUrl) {
        // URL dạng: https://res.cloudinary.com/cloud/image/upload/v123/fourseasontravel/abc.jpg
        String[] parts = imageUrl.split("/");
        String fileName = parts[parts.length - 1];
        String folder = parts[parts.length - 2];
        return folder + "/" + fileName.split("\\.")[0];
    }
}