package com.fourseasontravel.backend.model;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
@Data // Lombok: Tự động tạo Getter, Setter, toString...
@NoArgsConstructor // Lombok: Tự tạo constructor không tham số
@AllArgsConstructor // Lombok: Tự tạo constructor đầy đủ tham số
@Document(collection = "locations") // Ánh xạ class này vào collection 'locations' trong MongoDB
public class Location {
    @Id
    private String id; // ID tự động sinh của MongoDB

    private String name;
    private String description;
    private String region;       // Ví dụ: Miền Bắc, Miền Trung...
    private String bestSeason;   // Ví dụ: Mùa Xuân, Mùa Thu...

    private String nameEn;        // Tên tiếng Anh (VD: "Ha Long Bay")
    private String descriptionEn; // Mô tả tiếng Anh (VD: "UNESCO World Heritage...")
    private String regionEn;      // Vùng miền (VD: "North Vietnam")
    private String bestSeasonEn;
    private Double averageRating = 0.0;
    private Integer reviewCount = 0;
    private List<String> images; // Lưu danh sách các URL ảnh

}
