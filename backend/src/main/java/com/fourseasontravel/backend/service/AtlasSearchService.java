package com.fourseasontravel.backend.service;

import com.fourseasontravel.backend.model.Article;
import com.fourseasontravel.backend.model.Location;
import com.fourseasontravel.backend.model.Tour;
import com.fourseasontravel.backend.repository.ArticleRepository;
import com.fourseasontravel.backend.repository.LocationRepository;
import com.fourseasontravel.backend.repository.TourRepository;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@Profile("prod") // ← Chỉ active khi chạy profile prod
public class AtlasSearchService implements SearchService {

    @Autowired private MongoTemplate      mongoTemplate;
    @Autowired private TourRepository     tourRepository;
    @Autowired private ArticleRepository  articleRepository;
    @Autowired private LocationRepository locationRepository;

    @Override
    public Map<String, Object> search(String keyword, String date) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("tours",     searchTours(keyword, date));
        result.put("articles",  searchArticles(keyword));
        result.put("locations", searchLocations(keyword));

        int total = ((List<?>) result.get("tours")).size()
                + ((List<?>) result.get("articles")).size()
                + ((List<?>) result.get("locations")).size();
        result.put("total",   total);
        result.put("keyword", keyword);
        return result;
    }

    // ── Tìm Tour ────────────────────────────────────────────────
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> searchTours(String keyword, String date) {
        try {
            List<Document> pipeline = new ArrayList<>();

            // $search stage
            Document searchStage = new Document("$search", new Document()
                    .append("index", "default")
                    .append("compound", new Document()
                            .append("must", List.of(
                                    new Document("text", new Document()
                                            .append("query", keyword)
                                            .append("path", List.of("name", "itinerary"))
                                            .append("fuzzy", new Document("maxEdits", 1))
                                    )
                            ))
                            .append("filter", List.of(
                                    new Document("equals", new Document()
                                            .append("path", "isApproved").append("value", true)),
                                    new Document("equals", new Document()
                                            .append("path", "isRejected").append("value", false))
                            ))
                    )
            );
            pipeline.add(searchStage);

            // $limit
            pipeline.add(new Document("$limit", 20));

            // $project
            pipeline.add(new Document("$project", new Document()
                    .append("_id",            0)
                    .append("id",             new Document("$toString", "$_id"))
                    .append("type",           "tour")
                    .append("name",           1)
                    .append("itinerary",      1)
                    .append("price",          1)
                    .append("duration",       1)
                    .append("departureDate",  1)
                    .append("availableSlots", 1)
                    .append("image", new Document("$let", new Document()
                            .append("vars", new Document("first",
                                    new Document("$arrayElemAt", List.of("$images", 0))))
                            .append("in", "$$first.url")
                    ))
            ));

            List<Document> results = mongoTemplate.getDb()
                    .getCollection("tours")
                    .aggregate(pipeline, Document.class)
                    .into(new ArrayList<>());

            return results.stream()
                    .map(doc -> (Map<String, Object>) new HashMap<>(doc))
                    .toList();

        } catch (Exception e) {
            System.err.println("Atlas Search tours error: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    // ── Tìm Article ──────────────────────────────────────────────
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> searchArticles(String keyword) {
        try {
            List<Document> pipeline = List.of(
                    new Document("$search", new Document()
                            .append("index", "default")
                            .append("compound", new Document()
                                    .append("must", List.of(
                                            new Document("text", new Document()
                                                    .append("query", keyword)
                                                    .append("path", List.of("title", "content"))
                                                    .append("fuzzy", new Document("maxEdits", 1))
                                            )
                                    ))
                                    .append("filter", List.of(
                                            new Document("equals", new Document()
                                                    .append("path", "isApproved").append("value", true)),
                                            new Document("equals", new Document()
                                                    .append("path", "isRejected").append("value", false))
                                    ))
                            )
                    ),
                    new Document("$limit", 10),
                    new Document("$project", new Document()
                            .append("_id",       0)
                            .append("id",        new Document("$toString", "$_id"))
                            .append("type",      "article")
                            .append("title",     1)
                            .append("author",    1)
                            .append("createdAt", 1)
                            .append("image",     "$imageUrl")
                    )
            );

            List<Document> results = mongoTemplate.getDb()
                    .getCollection("articles")
                    .aggregate(pipeline, Document.class)
                    .into(new ArrayList<>());

            return results.stream()
                    .map(doc -> (Map<String, Object>) new HashMap<>(doc))
                    .toList();

        } catch (Exception e) {
            System.err.println("Atlas Search articles error: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    // ── Tìm Location ─────────────────────────────────────────────
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> searchLocations(String keyword) {
        try {
            List<Document> pipeline = List.of(
                    new Document("$search", new Document()
                            .append("index", "default")
                            .append("text", new Document()
                                    .append("query", keyword)
                                    .append("path", List.of("name", "description", "region"))
                                    .append("fuzzy", new Document("maxEdits", 1))
                            )
                    ),
                    new Document("$limit", 10),
                    new Document("$project", new Document()
                            .append("_id",    0)
                            .append("id",     new Document("$toString", "$_id"))
                            .append("type",   "location")
                            .append("name",   1)
                            .append("region", 1)
                            .append("image",  new Document("$arrayElemAt",
                                    List.of("$images", 0)))
                    )
            );

            List<Document> results = mongoTemplate.getDb()
                    .getCollection("locations")
                    .aggregate(pipeline, Document.class)
                    .into(new ArrayList<>());

            return results.stream()
                    .map(doc -> (Map<String, Object>) new HashMap<>(doc))
                    .toList();

        } catch (Exception e) {
            System.err.println("Atlas Search locations error: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    // ── Atlas Search không cần sync ──────────────────────────────
    @Override public void syncAll()    { /* Atlas tự index */ }
    @Override public void syncTours()  { /* Atlas tự index */ }
    @Override public void syncArticles()  { /* Atlas tự index */ }
    @Override public void syncLocations() { /* Atlas tự index */ }
    @Override public void deleteDocument(String indexName, String id) { /* Atlas tự xóa */ }
    @Override public void resetAllIndexes() { /* Atlas tự quản lý */ }
}