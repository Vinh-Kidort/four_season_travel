package com.fourseasontravel.backend.repository;

import com.fourseasontravel.backend.model.Article;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleRepository extends MongoRepository<Article, String> {
    List<Article> findByAuthor(String author);
    List<Article> findByIsApprovedTrue();
    List<Article> findByIsApprovedFalseAndIsRejectedFalse();


}