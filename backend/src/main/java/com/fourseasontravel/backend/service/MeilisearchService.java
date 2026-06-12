package com.fourseasontravel.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meilisearch.sdk.Client;
import com.meilisearch.sdk.Index;
import com.meilisearch.sdk.SearchRequest;
import com.meilisearch.sdk.model.Searchable;
import com.fourseasontravel.backend.model.Tour;
import com.fourseasontravel.backend.model.Article;
import com.fourseasontravel.backend.model.Location;
import com.fourseasontravel.backend.repository.TourRepository;
import com.fourseasontravel.backend.repository.ArticleRepository;
import com.fourseasontravel.backend.repository.LocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class MeilisearchService {

    @Autowired private Client             meilisearchClient;
    @Autowired private TourRepository     tourRepository;
    @Autowired private ArticleRepository  articleRepository;
    @Autowired private LocationRepository locationRepository;

    private final ObjectMapper mapper = new ObjectMapper();

    private static final String INDEX_TOURS     = "tours";
    private static final String INDEX_ARTICLES  = "articles";
    private static final String INDEX_LOCATIONS = "locations";

    // ── Sync toàn bộ ─────────────────────────────────────────
    public void syncAll() {
        syncTours();
        syncArticles();
        syncLocations();
    }

    public void syncTours() {
        try {
            List<Tour> tours = tourRepository.findByIsApprovedTrue();
            List<Map<String, Object>> docs = new ArrayList<>();

            for (Tour t : tours) {
                if (t.getAvailableSlots() == null || t.getAvailableSlots() <= 0) continue;
                Map<String, Object> doc = new LinkedHashMap<>();
                doc.put("id",             t.getId());
                doc.put("type",           "tour");
                doc.put("name",           t.getName() != null ? t.getName() : "");
                doc.put("itinerary",      t.getItinerary() != null ? t.getItinerary() : "");
                doc.put("duration",       t.getDuration() != null ? t.getDuration() : "");
                doc.put("price",          t.getPrice() != null ? t.getPrice() : 0);
                doc.put("departureDate",  t.getDepartureDate() != null ? t.getDepartureDate() : "");
                doc.put("availableSlots", t.getAvailableSlots());
                doc.put("image",          t.getImages() != null && !t.getImages().isEmpty()
                        ? t.getImages().get(0).getUrl() : "");
                docs.add(doc);
            }

            Index index = meilisearchClient.index(INDEX_TOURS);
            index.addDocuments(mapper.writeValueAsString(docs), "id");
            index.updateSearchableAttributesSettings(
                    new String[]{"name", "itinerary", "duration", "departureDate"}
            );
            index.updateFilterableAttributesSettings(
                    new String[]{"departureDate", "price", "availableSlots"}
            );
            System.out.println("✅ Synced " + docs.size() + " tours");
        } catch (Exception e) {
            System.err.println("❌ Sync tours error: " + e.getMessage());
        }
    }

    public void syncArticles() {
        try {
            List<Article> articles = articleRepository.findByIsApprovedTrue();
            List<Map<String, Object>> docs = new ArrayList<>();

            for (Article a : articles) {
                Map<String, Object> doc = new LinkedHashMap<>();
                doc.put("id",        a.getId());
                doc.put("type",      "article");
                doc.put("title",     a.getTitle() != null ? a.getTitle() : "");
                doc.put("content",   a.getContent() != null
                        ? a.getContent().substring(0, Math.min(500, a.getContent().length()))
                        : "");
                doc.put("author",    a.getAuthor() != null ? a.getAuthor() : "");
                doc.put("createdAt", a.getCreatedAt() != null ? a.getCreatedAt() : "");
                doc.put("image",     a.getImageUrl() != null ? a.getImageUrl() : "");
                docs.add(doc);
            }

            Index index = meilisearchClient.index(INDEX_ARTICLES);
            index.addDocuments(mapper.writeValueAsString(docs), "id");
            index.updateSearchableAttributesSettings(
                    new String[]{"title", "content", "author"}
            );
            System.out.println("✅ Synced " + docs.size() + " articles");
        } catch (Exception e) {
            System.err.println("❌ Sync articles error: " + e.getMessage());
        }
    }

    public void syncLocations() {
        try {
            List<Location> locations = locationRepository.findAll();
            List<Map<String, Object>> docs = new ArrayList<>();

            for (Location l : locations) {
                Map<String, Object> doc = new LinkedHashMap<>();
                doc.put("id",          l.getId());
                doc.put("type",        "location");
                doc.put("name",        l.getName() != null ? l.getName() : "");
                doc.put("description", l.getDescription() != null ? l.getDescription() : "");
                doc.put("region",      l.getRegion() != null ? l.getRegion() : "");
                doc.put("bestSeason",  l.getBestSeason() != null ? l.getBestSeason() : "");
                doc.put("image",       l.getImages() != null && !l.getImages().isEmpty()
                        ? l.getImages().get(0) : "");
                docs.add(doc);
            }
            

            Index index = meilisearchClient.index(INDEX_LOCATIONS);
            index.addDocuments(mapper.writeValueAsString(docs), "id");
            index.updateSearchableAttributesSettings(
                    new String[]{"name", "description", "region", "bestSeason"}
            );

            // ── THÊM: cấu hình synonyms tiếng Việt ──────────────
            Map<String, String[]> synonyms = new HashMap<>();
            synonyms.put("hcm",  new String[]{"thành phố hồ chí minh", "sài gòn", "sg"});
            synonyms.put("sg",   new String[]{"thành phố hồ chí minh", "sài gòn", "hcm"});
            synonyms.put("hn",   new String[]{"hà nội", "hanoi"});
            synonyms.put("đn",   new String[]{"đà nẵng"});
            synonyms.put("đl",   new String[]{"đà lạt"});
            synonyms.put("pq",   new String[]{"phú quốc"});
            index.updateSynonymsSettings(synonyms);

            System.out.println("✅ Synced " + docs.size() + " locations");
        } catch (Exception e) {
            System.err.println("❌ Sync locations error: " + e.getMessage());
        }
    }

    // ── Tìm kiếm tổng hợp ────────────────────────────────────
    public Map<String, Object> search(String keyword, String date) {
        Map<String, Object> result = new LinkedHashMap<>();

        result.put("tours",     searchIndex(INDEX_TOURS,     keyword, date));
        result.put("articles",  searchIndex(INDEX_ARTICLES,  keyword, null));
        result.put("locations", searchIndex(INDEX_LOCATIONS, keyword, null));

        int total = ((List<?>) result.get("tours")).size()
                + ((List<?>) result.get("articles")).size()
                + ((List<?>) result.get("locations")).size();
        result.put("total",   total);
        result.put("keyword", keyword);
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> searchIndex(String indexName, String keyword, String date) {
        try {
            Index index = meilisearchClient.index(indexName);

            SearchRequest.SearchRequestBuilder builder = SearchRequest.builder()
                    .q(keyword)
                    .limit(20);

            if (date != null && !date.isEmpty()) {
                builder.filter(new String[]{"departureDate = \"" + date + "\""});
            }

            // ── FIX: dùng Searchable thay vì SearchResult ────
            Searchable searchable = index.search(builder.build());

            // Lấy hits từ Searchable
            List<Map<String, Object>> hits = new ArrayList<>();
            Object rawHits = searchable.getHits();

            if (rawHits instanceof List<?>) {
                for (Object hit : (List<?>) rawHits) {
                    if (hit instanceof Map) {
                        hits.add((Map<String, Object>) hit);
                    }
                }
            }
            return hits;
        } catch (Exception e) {
            System.err.println("Search error [" + indexName + "]: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    // ── Xóa document khỏi index ──────────────────────────────
    public void deleteDocument(String indexName, String id) {
        try {
            meilisearchClient.index(indexName).deleteDocument(id);
            System.out.println("🗑️ Deleted " + id + " from " + indexName);
        } catch (Exception e) {
            System.err.println("Delete error: " + e.getMessage());
        }
    }

    public void resetAllIndexes() {
        try {
            meilisearchClient.deleteIndex("tours");
            meilisearchClient.deleteIndex("articles");
            meilisearchClient.deleteIndex("locations");
            // Đợi Meilisearch xử lý xong
            Thread.sleep(1500);
            System.out.println("✅ Đã xóa tất cả index cũ");
        } catch (Exception e) {
            System.err.println("⚠️ Reset index: " + e.getMessage());
        }
    }
}