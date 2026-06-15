package com.fourseasontravel.backend.service;

import java.util.Map;

public interface SearchService {
    Map<String, Object> search(String keyword, String date);
    void syncAll();
    void syncTours();
    void syncArticles();
    void syncLocations();
    void deleteDocument(String indexName, String id);
    void resetAllIndexes();
}