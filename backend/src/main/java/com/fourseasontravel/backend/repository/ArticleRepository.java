package com.fourseasontravel.backend.repository;

import com.fourseasontravel.backend.model.Article;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.mongodb.repository.Aggregation;
import java.util.List;

@Repository
public interface ArticleRepository extends MongoRepository<Article, String> {
    List<Article> findByAuthor(String author);
    List<Article> findByIsApprovedTrue();
    List<Article> findByIsApprovedFalseAndIsRejectedFalse();

    @Aggregation(pipeline = {
            "{ '$search': { 'index': 'default', 'text': { 'query': ?0, 'path': { 'wildcard': '*' } } } }",
            "{ '$limit': 20 }"
    })
    List<Article> searchArticlesByKeyword(String keyword);

}