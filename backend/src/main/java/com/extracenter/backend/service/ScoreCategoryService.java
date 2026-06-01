package com.extracenter.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.dto.ScoreCategoryRequest;
import com.extracenter.backend.entity.ScoreCategory;
import com.extracenter.backend.entity.Course;
import com.extracenter.backend.repository.ScoreCategoryRepository;
import com.extracenter.backend.repository.CourseRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ScoreCategoryService {

    @Autowired
    private ScoreCategoryRepository scoreCategoryRepository;

    @Autowired
    private CourseRepository courseRepository;

    /**
     * Get all score categories for a course
     */
    public List<ScoreCategory> getCategoriesByCourse(Long courseId) {
        return scoreCategoryRepository.findByCourseId(courseId);
    }

    /**
     * Create a new score category
     */
    @Transactional
    public ScoreCategory createCategory(Long courseId, ScoreCategoryRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        // Validate weight
        validateWeight(request.getWeight(), courseId);

        ScoreCategory category = new ScoreCategory();
        category.setName(request.getName());
        category.setWeight(request.getWeight());
        category.setCourse(course);

        return scoreCategoryRepository.save(category);
    }

    /**
     * Update a score category
     */
    @Transactional
    public ScoreCategory updateCategory(Long id, ScoreCategoryRequest request) {
        ScoreCategory category = scoreCategoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Score category not found"));

        // Validate weight, accounting for the existing category weight during updates
        validateWeight(request.getWeight(), category.getCourse().getId(), category.getWeight());

        category.setName(request.getName());
        category.setWeight(request.getWeight());

        return scoreCategoryRepository.save(category);
    }

    /**
     * Delete a score category
     */
    @Transactional
    public void deleteCategory(Long id) {
        ScoreCategory category = scoreCategoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Score category not found"));

        scoreCategoryRepository.delete(category);
    }

    /**
     * Validate weight:
     * - Must be between 0 and 100
     * - Must be divisible by 5
     * - Total weight of all categories in a course must not exceed 100
     */
    private void validateWeight(Integer weight, Long courseId) {
        validateWeight(weight, courseId, null);
    }

    private void validateWeight(Integer weight, Long courseId, Integer existingWeight) {
        if (weight == null) {
            return; // Weight is nullable
        }

        if (weight < 0 || weight > 100) {
            throw new IllegalArgumentException("Weight must be between 0 and 100");
        }

        if (weight % 5 != 0) {
            throw new IllegalArgumentException("Weight must be divisible by 5");
        }

        // Check total weight
        List<ScoreCategory> categories = scoreCategoryRepository.findByCourseId(courseId);
        int totalWeight = categories.stream()
                .map(ScoreCategory::getWeight)
                .filter(w -> w != null)
                .collect(Collectors.summingInt(Integer::intValue));

        if (existingWeight != null) {
            totalWeight -= existingWeight;
        }

        totalWeight += weight;

        if (totalWeight > 100) {
            throw new IllegalArgumentException(
                    "Total weight of all categories cannot exceed 100. Current total: " + totalWeight);
        }
    }

    /**
     * Calculate total weight for a course
     */
    public Integer calculateTotalWeight(Long courseId) {
        List<ScoreCategory> categories = scoreCategoryRepository.findByCourseId(courseId);
        return categories.stream()
                .map(ScoreCategory::getWeight)
                .filter(w -> w != null)
                .collect(Collectors.summingInt(Integer::intValue));
    }

    /**
     * Check if category weights are complete (total = 100)
     */
    public Boolean isWeightComplete(Long courseId) {
        Integer totalWeight = calculateTotalWeight(courseId);
        return totalWeight != null && totalWeight == 100;
    }
}
