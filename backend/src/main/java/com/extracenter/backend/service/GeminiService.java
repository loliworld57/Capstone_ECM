package com.extracenter.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Value("${gemini.api.key}")
    private String apiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String generateSummary(String lessonContent, String teacherRequirement) throws Exception {
        RestTemplate restTemplate = new RestTemplate();

        // 1. Construct the exact prompt
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append(
                "You are an expert educational assistant. Summarize the following lesson material clearly and concisely. ");
        promptBuilder.append("MUST RESPOND IN THE SAME LANGUAGE AS THE LESSON MATERIAL (e.g., Vietnamese). ");
        promptBuilder.append("Do not use markdown like ```, just return the plain text summary.\n\n");

        if (teacherRequirement != null && !teacherRequirement.trim().isEmpty()) {
            promptBuilder.append("CRITICAL INSTRUCTION FROM TEACHER: ").append(teacherRequirement).append("\n\n");
        }

        promptBuilder.append("Lesson Material:\n").append(lessonContent);

        // 2. Build the JSON request body for Gemini API
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", promptBuilder.toString());
        Map<String, Object> parts = new HashMap<>();
        parts.put("parts", List.of(textPart));
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(parts));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        // 3. Make the API Call
        String finalUrl = apiUrl + "?key=" + apiKey;

        ResponseEntity<String> response = restTemplate.postForEntity(finalUrl, entity, String.class);
        System.out.println("Gemini AI responded successfully!");
        // 4. Parse Google's nested JSON response to get just the text
        JsonNode rootNode = objectMapper.readTree(response.getBody());
        return rootNode
                .path("candidates").get(0)
                .path("content")
                .path("parts").get(0)
                .path("text").asText().trim();
    }
}