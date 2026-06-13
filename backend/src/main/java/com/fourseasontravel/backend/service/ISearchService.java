package com.fourseasontravel.backend.service;

import java.util.Map;

// Interface này định nghĩa quy chuẩn chung cho mọi công cụ tìm kiếm
public interface ISearchService {
    Map<String, Object> search(String keyword, String date);
}