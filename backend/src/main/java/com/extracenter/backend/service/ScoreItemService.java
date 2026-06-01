package com.extracenter.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.dto.ScoreItemRequest;
import com.extracenter.backend.entity.ScoreItem;
import com.extracenter.backend.entity.ScoreCategory;
import com.extracenter.backend.entity.Assignment;
import com.extracenter.backend.repository.ScoreItemRepository;
import com.extracenter.backend.repository.ScoreCategoryRepository;
import com.extracenter.backend.repository.AssignmentRepository;

import java.util.List;
import java.util.Optional;

@Service
public class ScoreItemService {

    @Autowired
    private ScoreItemRepository scoreItemRepository;

    @Autowired
    private ScoreCategoryRepository scoreCategoryRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    /**
     * Get all score items for a category
     */
    public List<ScoreItem> getItemsByCategory(Long scoreCategoryId) {
        return scoreItemRepository.findByScoreCategoryId(scoreCategoryId);
    }

    /**
     * Create a new score item
     */
    @Transactional
    public ScoreItem createScoreItem(Long scoreCategoryId, ScoreItemRequest request) {
        ScoreCategory category = scoreCategoryRepository.findById(scoreCategoryId)
                .orElseThrow(() -> new IllegalArgumentException("Score category not found"));

        ScoreItem item = new ScoreItem();
        item.setName(request.getName());
        item.setScoreCategory(category);

        // Link to assignment if provided
        if (request.getAssignmentId() != null) {
            Assignment assignment = assignmentRepository.findById(request.getAssignmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));
            item.setAssignment(assignment);
        }

        return scoreItemRepository.save(item);
    }

    /**
     * Update a score item
     */
    @Transactional
    public ScoreItem updateScoreItem(Long id, ScoreItemRequest request) {
        ScoreItem item = scoreItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Score item not found"));

        item.setName(request.getName());

        // Update assignment if provided
        if (request.getAssignmentId() != null) {
            Assignment assignment = assignmentRepository.findById(request.getAssignmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));
            item.setAssignment(assignment);
        }

        return scoreItemRepository.save(item);
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
    public ScoreItem createScoreItemForAssignment(Assignment assignment, ScoreCategory assignmentCategory) {
        ScoreItem item = new ScoreItem();
        item.setName(assignment.getTitle());
        item.setScoreCategory(assignmentCategory);
        item.setAssignment(assignment);

        return scoreItemRepository.save(item);
    }

    /**
     * Get score items by assignment
     */
    public List<ScoreItem> getItemsByAssignment(Long assignmentId) {
        return scoreItemRepository.findByAssignmentId(assignmentId);
    }
}
