package com.fourseasontravel.backend.config;

import com.meilisearch.sdk.Client;
import com.meilisearch.sdk.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "app.search.meilisearch.enabled", havingValue = "true")
public class MeilisearchConfig {

    @Value("${meilisearch.host}")
    private String host;

    @Value("${meilisearch.api-key}")
    private String apiKey;

    @Bean
    public Client meilisearchClient() {
        return new Client(new Config(host, apiKey));
    }
}