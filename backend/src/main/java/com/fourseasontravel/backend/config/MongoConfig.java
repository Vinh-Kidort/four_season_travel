package com.fourseasontravel.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;

@Configuration // Đánh dấu đây là file cấu hình hệ thống
public class MongoConfig extends AbstractMongoClientConfiguration {

    // Ép buộc Spring Boot dùng tên Database này!
    @Override
    protected String getDatabaseName() {
        return "four_season_travel";
    }

    // Nếu sau này bạn có mật khẩu, sẽ cấu hình thêm ở đây. Hiện tại để mặc định.
    @Override
    public boolean autoIndexCreation() {
        return true;
    }
}