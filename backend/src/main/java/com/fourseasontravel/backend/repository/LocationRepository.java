package com.fourseasontravel.backend.repository;
import com.fourseasontravel.backend.model.Location;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LocationRepository extends MongoRepository<Location, String> {
    // Chỉ cần kế thừa MongoRepository, Spring Boot sẽ tự động tạo sẵn
    // các hàm: save(), findAll(), findById(), delete() cho bạn. Rất xịn!
}
