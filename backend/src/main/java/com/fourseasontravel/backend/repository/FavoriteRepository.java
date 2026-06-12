package com.fourseasontravel.backend.repository;

import com.fourseasontravel.backend.model.Favorite;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends MongoRepository<Favorite, String> {
    List<Favorite> findByUserId(String userId);
    Optional<Favorite> findByUserIdAndItemIdAndItemType(String userId, String itemId, String itemType);
    void deleteByUserIdAndItemIdAndItemType(String userId, String itemId, String itemType);
    boolean existsByUserIdAndItemIdAndItemType(String userId, String itemId, String itemType);
    void deleteByUserId(String userId);
}
