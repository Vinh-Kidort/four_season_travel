package com.fourseasontravel.backend.repository;

import com.fourseasontravel.backend.model.RefreshToken;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;
import java.util.List;

public interface RefreshTokenRepository extends MongoRepository<RefreshToken, String> {
    Optional<RefreshToken> findByToken(String token);
    List<RefreshToken> findByEmail(String email);
    void deleteByToken(String token);
    void deleteByEmail(String email);
}