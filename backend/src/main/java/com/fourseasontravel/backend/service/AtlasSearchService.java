package com.fourseasontravel.backend.service;

import com.fourseasontravel.backend.model.Article;
import com.fourseasontravel.backend.model.Location;
import com.fourseasontravel.backend.model.Tour;
import com.fourseasontravel.backend.repository.ArticleRepository;
import com.fourseasontravel.backend.repository.LocationRepository;
import com.fourseasontravel.backend.repository.TourRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
// Dòng này nghĩa là: Nếu không cấu hình gì, hoặc enabled = false, thì tự động chạy Atlas Search
@ConditionalOnProperty(name = "app.search.meilisearch.enabled", havingValue = "false", matchIfMissing = true)
public class AtlasSearchService implements ISearchService {

    @Autowired private TourRepository tourRepository;
    @Autowired private ArticleRepository articleRepository;
    @Autowired private LocationRepository locationRepository;

    @Override
    public Map<String, Object> search(String keyword, String date) {
        Map<String, Object> result = new LinkedHashMap<>();

        // 1. Tìm kiếm qua MongoDB Atlas
        // (Lưu ý: Bạn phải thêm hàm search bằng @Aggregation vào 3 file Repository nhé)
        List<Tour> tours = tourRepository.searchToursByKeyword(keyword);
        List<Article> articles = articleRepository.searchArticlesByKeyword(keyword);
        List<Location> locations = locationRepository.searchLocationsByKeyword(keyword);

        // 2. Chuyển đổi dữ liệu giống hệt Meilisearch để Frontend không bị lỗi
        List<Map<String, Object>> mappedTours = new ArrayList<>();
        for (Tour t : tours) {
            // Nếu có lọc theo ngày, bỏ qua các tour không khớp ngày
            if (date != null && !date.isEmpty() && !date.equals(t.getDepartureDate())) continue;

            Map<String, Object> doc = new LinkedHashMap<>();
            doc.put("id", t.getId());
            doc.put("type", "tour");
            doc.put("name", t.getName());
            doc.put("price", t.getPrice());
            doc.put("duration", t.getDuration());
            doc.put("image", (t.getImages() != null && !t.getImages().isEmpty()) ? t.getImages().get(0).getUrl() : "");
            mappedTours.add(doc);
        }

        List<Map<String, Object>> mappedArticles = new ArrayList<>();
        for (Article a : articles) {
            Map<String, Object> doc = new LinkedHashMap<>();
            doc.put("id", a.getId());
            doc.put("type", "article");
            doc.put("title", a.getTitle());
            doc.put("author", a.getAuthor());
            doc.put("image", a.getImageUrl());
            mappedArticles.add(doc);
        }

        List<Map<String, Object>> mappedLocations = new ArrayList<>();
        for (Location l : locations) {
            Map<String, Object> doc = new LinkedHashMap<>();
            doc.put("id", l.getId());
            doc.put("type", "location");
            doc.put("name", l.getName());
            doc.put("region", l.getRegion());
            doc.put("image", (l.getImages() != null && !l.getImages().isEmpty()) ? l.getImages().get(0) : "");
            mappedLocations.add(doc);
        }

        result.put("tours", mappedTours);
        result.put("articles", mappedArticles);
        result.put("locations", mappedLocations);

        int total = mappedTours.size() + mappedArticles.size() + mappedLocations.size();
        result.put("total", total);
        result.put("keyword", keyword);

        return result;
    }
}