package com.fourseasontravel.backend.repository;

import com.fourseasontravel.backend.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email); // Hàm tự chế: Tìm User theo Email
}