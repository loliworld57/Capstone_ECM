package com.extracenter.backend.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.dto.ScoreItemRequest;
import com.extracenter.backend.dto.ScoreItemResponse;
import com.extracenter.backend.entity.Assignment;
import com.extracenter.backend.entity.ScoreCategory;
import com.extracenter.backend.entity.ScoreItem;
import com.extracenter.backend.repository.AssignmentRepository;
import com.extracenter.backend.repository.ScoreCategoryRepository;
import com.extracenter.backend.repository.ScoreItemRepository;

@Service
public class ScoreItemService {

    @Autowired
    private ScoreItemRepository scoreItemRepository;

    @Autowired
    private ScoreCategoryRepository scoreCategoryRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    /**
     * Helper to map Entity models cleanly to flat Response DTO wrappers
     */
    private ScoreItemResponse convertToResponse(ScoreItem item) {
        if (item == null) return null;
        return ScoreItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                // Accessing the ID of a proxy relationship does not trigger initialization or serialization errors
                .scoreCategoryId(item.getScoreCategory() != null ? item.getScoreCategory().getId() : null)
                .assignmentId(item.getAssignment() != null ? item.getAssignment().getId() : null)
                .build();
    }

    /**
     * Get all score items for a category
     */
    public List<ScoreItemResponse> getItemsByCategory(Long scoreCategoryId) {
        return scoreItemRepository.findByScoreCategoryId(scoreCategoryId)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Create a new score item
     */
    @Transactional
    public ScoreItemResponse createScoreItem(Long scoreCategoryId, ScoreItemRequest request) {
        ScoreCategory category = scoreCategoryRepository.findById(scoreCategoryId)
                .orElseThrow(() -> new IllegalArgumentException("Score category not found"));

        ScoreItem item = new ScoreItem();
        item.setName(request.getName());
        item.setScoreCategory(category);

        if (request.getAssignmentId() != null) {
            Assignment assignment = assignmentRepository.findById(request.getAssignmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));
            item.setAssignment(assignment);
        }

        ScoreItem savedItem = scoreItemRepository.save(item);
        return convertToResponse(savedItem);
    }

    /**
     * Update a score item
     */
    @Transactional
    public ScoreItemResponse updateScoreItem(Long id, ScoreItemRequest request) {
        ScoreItem item = scoreItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Score item not found"));

        item.setName(request.getName());

        if (request.getScoreCategoryId() != null) {
            ScoreCategory category = scoreCategoryRepository.findById(request.getScoreCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Score category not found"));
            item.setScoreCategory(category);
        }

        if (request.getAssignmentId() != null) {
            Assignment assignment = assignmentRepository.findById(request.getAssignmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));
            item.setAssignment(assignment);
        }

        ScoreItem savedItem = scoreItemRepository.save(item);
        return convertToResponse(savedItem);
    }

    /**
     * Delete a score item (and all related student scores)
     */
    @Transactional
    public void deleteScoreItem(Long id) {
        ScoreItem item = scoreItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Score item not found"));

        scoreItemRepository.delete(item);
    }

    /**
     * Create a score item for an assignment
     * Called when an assignment is created
     */
    @Transactional
    public ScoreItemResponse createScoreItemForAssignment(Assignment assignment, ScoreCategory assignmentCategory) {
        ScoreItem item = new ScoreItem();
        item.setName(assignment.getTitle());
        item.setScoreCategory(assignmentCategory);
        item.setAssignment(assignment);

        ScoreItem savedItem = scoreItemRepository.save(item);
        return convertToResponse(savedItem);
    }

    /**
     * Get score items by assignment
     */
    public List<ScoreItemResponse> getItemsByAssignment(Long assignmentId) {
        return scoreItemRepository.findByAssignmentId(assignmentId)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
}