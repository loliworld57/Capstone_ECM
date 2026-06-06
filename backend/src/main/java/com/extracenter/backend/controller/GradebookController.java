package com.extracenter.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.extracenter.backend.dto.GradebookResponse;
import com.extracenter.backend.dto.ScoreCategoryRequest;
import com.extracenter.backend.dto.ScoreItemRequest;
import com.extracenter.backend.dto.ScoreItemResponse;
import com.extracenter.backend.dto.StudentScoreRequest;
import com.extracenter.backend.dto.StudentScoreResponse;
import com.extracenter.backend.entity.ScoreCategory;
import com.extracenter.backend.entity.ScoreItem;
import com.extracenter.backend.entity.StudentScore;
import com.extracenter.backend.service.GradebookService;
import com.extracenter.backend.service.ScoreCategoryService;
import com.extracenter.backend.service.ScoreItemService;
import com.extracenter.backend.service.StudentScoreService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(originPatterns = "*")
public class GradebookController {

    @Autowired
    private GradebookService gradebookService;

    @Autowired
    private ScoreCategoryService scoreCategoryService;

    @Autowired
    private ScoreItemService scoreItemService;

    @Autowired
    private StudentScoreService studentScoreService;

    // ==================== GRADEBOOK ====================

    /**
     * GET /api/courses/{courseId}/gradebook
     * Get complete gradebook data for a course
     */
    @GetMapping("/{courseId}/gradebook")
    public ResponseEntity<GradebookResponse> getGradebook(@PathVariable Long courseId) {

        GradebookResponse gradebook = gradebookService.getGradebook(courseId);

        return ResponseEntity.ok(gradebook);
    }

    // ==================== SCORE CATEGORIES ====================

    /**
     * GET /api/courses/{courseId}/score-categories
     * Get all score categories for a course
     */
    @GetMapping("/{courseId}/score-categories")
    public ResponseEntity<List<ScoreCategory>> getCategories(@PathVariable Long courseId) {
        List<ScoreCategory> categories = scoreCategoryService.getCategoriesByCourse(courseId);
        return ResponseEntity.ok(categories);
    }

    /**
     * POST /api/courses/{courseId}/score-categories
     * Create a new score category
     */
    @PostMapping("/{courseId}/score-categories")
    public ResponseEntity<?> createCategory(
            @PathVariable Long courseId,
            @Valid @RequestBody ScoreCategoryRequest request) {
        try {
            ScoreCategory category = scoreCategoryService.createCategory(courseId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(category);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /api/score-categories/{id}
     * Update a score category
     */
    @PutMapping("/{courseId}/score-categories/{id}")
    public ResponseEntity<?> updateCategory(
            @PathVariable Long courseId,
            @PathVariable Long id,
            @Valid @RequestBody ScoreCategoryRequest request) {
        try {
            ScoreCategory category = scoreCategoryService.updateCategory(id, request);
            return ResponseEntity.ok(category);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * DELETE /api/score-categories/{id}
     * Delete a score category
     */
    @DeleteMapping("/{courseId}/score-categories/{id}")
    public ResponseEntity<?> deleteCategory(
            @PathVariable Long courseId,
            @PathVariable Long id) {
        try {
            scoreCategoryService.deleteCategory(id);
            return ResponseEntity.ok(Map.of("message", "Score category deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== SCORE ITEMS ====================

    /**
     * POST /api/score-categories/{scoreCategoryId}/score-items
     * Create a new score item
     */
    @PostMapping("/{courseId}/score-categories/{scoreCategoryId}/score-items")
    public ResponseEntity<?> createScoreItem(
            @PathVariable Long courseId,
            @PathVariable Long scoreCategoryId,
            @Valid @RequestBody ScoreItemRequest request) {
        try {
            ScoreItemResponse item = scoreItemService.createScoreItem(scoreCategoryId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(item);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /api/score-items/{id}
     * Update a score item
     */
    @PutMapping("/{courseId}/score-items/{id}")
    public ResponseEntity<?> updateScoreItem(
            @PathVariable Long courseId,
            @PathVariable Long id,
            @Valid @RequestBody ScoreItemRequest request) {
        try {
            ScoreItemResponse item = scoreItemService.updateScoreItem(id, request);
            return ResponseEntity.ok(item);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * DELETE /api/score-items/{id}
     * Delete a score item
     */
    @DeleteMapping("/{courseId}/score-items/{id}")
    public ResponseEntity<?> deleteScoreItem(
            @PathVariable Long courseId,
            @PathVariable Long id) {
        try {
            scoreItemService.deleteScoreItem(id);
            return ResponseEntity.ok(Map.of("message", "Score item deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== STUDENT SCORES ====================

    /**
     * PUT /api/student-scores
     * Update a single student score
     */
    @PutMapping("/{courseId}/student-scores")
    public ResponseEntity<?> updateStudentScore(
            @PathVariable Long courseId,
            @Valid @RequestBody StudentScoreRequest request) {
        try {
            StudentScore score = studentScoreService.updateScore(request);
            return ResponseEntity.ok(studentScoreService.toDTO(score));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /api/student-scores/bulk
     * Bulk update student scores
     */
    @PutMapping("/{courseId}/student-scores/bulk")
    public ResponseEntity<?> bulkUpdateStudentScores(
            @PathVariable Long courseId,
            @RequestBody List<StudentScoreRequest> requests) {
        try {
            List<StudentScore> scores = studentScoreService.bulkUpdateScores(requests);
            List<StudentScoreResponse> responses = scores.stream()
                    .map(studentScoreService::toDTO)
                    .toList();
            return ResponseEntity.ok(responses);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
