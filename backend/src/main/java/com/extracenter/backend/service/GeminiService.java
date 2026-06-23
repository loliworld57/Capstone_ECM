package com.extracenter.backend.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import com.extracenter.backend.dto.QuizQuestionDTO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

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
                        promptBuilder.append("CRITICAL INSTRUCTION FROM TEACHER: ").append(teacherRequirement)
                                        .append("\n\n");
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

        public List<QuizQuestionDTO> generateQuiz(String lessonContent, int numberOfQuestions) throws Exception {

                String prompt = String.format(
                                """
                                                You are an expert teacher.

                                                Generate %d multiple-choice questions based strictly on the lesson material.

                                                Return ONLY a raw JSON array.

                                                Do NOT use markdown.
                                                Do NOT use ```json.
                                                Do NOT add explanations outside JSON.

                                                JSON format:

                                                [
                                                  {
                                                    "question": "Question text",
                                                    "options": [
                                                      "Option A text",
                                                      "Option B text",
                                                      "Option C text",
                                                      "Option D text"
                                                    ],
                                                    "correctAnswer": "FULL TEXT OF THE CORRECT OPTION",
                                                    "explanation": "Short explanation"
                                                  }
                                                ]

                                                IMPORTANT RULES:
                                                - options must contain ONLY the option text
                                                - Do NOT prefix options with A), B), C), D)
                                                - correctAnswer must be the FULL TEXT of the correct option
                                                - correctAnswer must NEVER be a letter such as A, B, C, or D

                                                Lesson Material:
                                                %s
                                                """,
                                numberOfQuestions,
                                lessonContent);

                Map<String, Object> requestBody = Map.of(
                                "contents", List.of(
                                                Map.of("parts", List.of(
                                                                Map.of("text", prompt)))));

                try {
                        System.out.println("🚀 Attempting quiz generation with Gemini 2.5 Flash...");

                        String primaryUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="
                                        + apiKey;

                        return executeAiRequest(primaryUrl, requestBody);

                } catch (HttpServerErrorException.ServiceUnavailable e) {

                        System.out.println(
                                        "⚠️ Gemini overloaded. Falling back...");

                        String fallbackUrl = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key="
                                        + apiKey;

                        return executeAiRequest(fallbackUrl, requestBody);
                }
        }

        private List<QuizQuestionDTO> executeAiRequest(
                        String url,
                        Map<String, Object> requestBody) throws Exception {

                RestTemplate restTemplate = new RestTemplate();

                ResponseEntity<String> response = restTemplate.postForEntity(
                                url,
                                requestBody,
                                String.class);

                JsonNode rootNode = objectMapper.readTree(response.getBody());

                String aiResponseText = rootNode.path("candidates").get(0)
                                .path("content").path("parts").get(0)
                                .path("text").asText();

                aiResponseText = aiResponseText
                                .replace("```json", "")
                                .replace("```", "")
                                .trim();

                System.out.println("========== GEMINI RAW ==========");
                System.out.println(aiResponseText);
                System.out.println("================================");

                List<QuizQuestionDTO> questions = objectMapper.readValue(
                                aiResponseText,
                                new TypeReference<List<QuizQuestionDTO>>() {
                                });

                for (QuizQuestionDTO q : questions) {

                        String answer = q.getCorrectAnswer();

                        if (answer == null)
                                continue;

                        answer = answer.trim();

                        // Gemini trả A/B/C/D
                        if (answer.matches("(?i)^[A-D]$")) {

                                int index = Character.toUpperCase(answer.charAt(0)) - 'A';

                                if (index >= 0 && index < q.getOptions().size()) {

                                        String optionText = q.getOptions().get(index);

                                        optionText = optionText
                                                        .replaceFirst(
                                                                        "(?i)^[A-D][\\)\\.\\-:\\s]+",
                                                                        "")
                                                        .trim();

                                        q.setCorrectAnswer(optionText);
                                }
                        }

                        // Gemini trả "B) something"
                        else {

                                q.setCorrectAnswer(
                                                answer.replaceFirst(
                                                                "(?i)^[A-D][\\)\\.\\-:\\s]+",
                                                                "")
                                                                .trim());
                        }

                        // làm sạch toàn bộ options
                        List<String> cleanedOptions = q.getOptions().stream()
                                        .map(opt -> opt.replaceFirst(
                                                        "(?i)^[A-D][\\)\\.\\-:\\s]+",
                                                        "")
                                                        .trim())
                                        .toList();

                        q.setOptions(cleanedOptions);
                }

                return questions;
        }
}