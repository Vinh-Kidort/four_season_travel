package com.fourseasontravel.backend.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;

@Configuration
public class MongoConfig extends AbstractMongoClientConfiguration {

    // Ép file Java đọc biến môi trường từ application.properties
    @Value("${spring.data.mongodb.uri}")
    private String mongoUri;

    @Override
    protected String getDatabaseName() {
        return "fourseason";
    }

    // BẮT BUỘC PHẢI THÊM HÀM NÀY để nạp chuỗi kết nối Atlas vào mã Java
    @Override
    public MongoClient mongoClient() {
        return MongoClients.create(mongoUri);
    }

    @Override
    public boolean autoIndexCreation() {
        return true;
    }
}