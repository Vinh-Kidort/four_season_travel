package com.fourseasontravel.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.http.*;

import java.util.Map;

@Service
public class RecaptchaService {

    @Value("${recaptcha.secret}")
    private String secretKey;

    @Value("${recaptcha.verify-url}")
    private String verifyUrl;

    @Value("${recaptcha.min-score}")
    private double minScore;

    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings("unchecked")
    public boolean verify(String token) {
        if (token == null || token.isEmpty()) return false;

        try {
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("secret",   secretKey);
            params.add("response", token);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> req =
                    new HttpEntity<>(params, headers);

            ResponseEntity<Map> res = restTemplate.postForEntity(
                    verifyUrl, req, Map.class);

            Map<String, Object> body = res.getBody();
            if (body == null) return false;

            boolean success = Boolean.TRUE.equals(body.get("success"));
            double  score   = body.get("score") != null
                    ? ((Number) body.get("score")).doubleValue() : 0;

            return success && score >= minScore;
        } catch (Exception e) {
            System.err.println("reCAPTCHA verify error: " + e.getMessage());
            return false; // Fail safe: chặn nếu lỗi
        }
    }
}