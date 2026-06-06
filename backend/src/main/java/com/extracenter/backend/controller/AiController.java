package com.extracenter.backend.controller;

import com.extracenter.backend.dto.AiSummaryRequest;
import com.extracenter.backend.entity.Material;
import com.extracenter.backend.repository.MaterialRepository;
import com.extracenter.backend.service.DocumentExtractionService;
import com.extracenter.backend.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private DocumentExtractionService documentExtractionService;

    // 1. Endpoint to just GENERATE the summary (doesn't save yet)
    @PostMapping("/generate-summary")
    @PreAuthorize("hasAnyAuthority('TEACHER', 'MANAGER')")
    public ResponseEntity<?> generateSummaryPreview(@RequestBody AiSummaryRequest request) {
        try {
            // 1. Find the material in the database
            Material material = materialRepository.findById(request.getMaterialId())
                    .orElseThrow(() -> new RuntimeException("Material not found"));

            String fileUrl = material.getFileUrl(); // e.g., https://res.cloudinary.com/.../lesson.pdf

            // 2. Extract the raw text directly from the Cloudinary file
            String extractedText = documentExtractionService.extractTextFromUrl(fileUrl);

            // Safety check: Make sure the PDF wasn't completely empty or just scanned
            // images
            if (extractedText == null || extractedText.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Could not extract any text from this document. It might be a scanned image.");
            }

            // 3. Send the REAL text to Google Gemini
            String summary = geminiService.generateSummary(extractedText, request.getRequirement());

            return ResponseEntity.ok(Map.of("summary", summary));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("AI Error: " + e.getMessage());
        }
    }

    // 2. Endpoint to officially SAVE the summary to the database
    @PutMapping("/save-summary/{materialId}")
    @PreAuthorize("hasAnyAuthority('TEACHER', 'MANAGER')")
    public ResponseEntity<?> saveSummaryToMaterial(
            @PathVariable Long materialId,
            @RequestBody Map<String, String> payload) {

        try {
            Material material = materialRepository.findById(materialId)
                    .orElseThrow(() -> new RuntimeException("Material not found"));

            material.setSummary(payload.get("summary"));
            materialRepository.save(material);

            return ResponseEntity.ok("Summary saved successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error saving summary: " + e.getMessage());
        }
    }
}