package com.extracenter.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.extracenter.backend.dto.GradebookResponse;
import com.extracenter.backend.dto.GradebookResponse.ScoreCategoryDTO;
import com.extracenter.backend.dto.GradebookResponse.ScoreItemDTO;
import com.extracenter.backend.dto.GradebookResponse.StudentGradebookRowDTO;
import com.extracenter.backend.entity.Course;
import com.extracenter.backend.entity.Enrollment;
import com.extracenter.backend.entity.ScoreCategory;
import com.extracenter.backend.entity.ScoreItem;
import com.extracenter.backend.entity.StudentScore;
import com.extracenter.backend.repository.CourseRepository;
import com.extracenter.backend.repository.EnrollmentRepository;
import com.extracenter.backend.repository.ScoreCategoryRepository;
import com.extracenter.backend.repository.ScoreItemRepository;
import com.extracenter.backend.repository.StudentScoreRepository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GradebookService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private ScoreCategoryRepository scoreCategoryRepository;

    @Autowired
    private ScoreItemRepository scoreItemRepository;

    @Autowired
    private StudentScoreRepository studentScoreRepository;

    @Autowired
    private ScoreCategoryService scoreCategoryService;

    /**
     * Get complete gradebook data for a course
     */
    public GradebookResponse getGradebook(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        // Get all categories and items
        List<ScoreCategory> categories = scoreCategoryRepository.findByCourseId(courseId);

        List<Long> categoryIds = categories.stream()
                .map(ScoreCategory::getId)
                .toList();

        List<ScoreItem> scoreItems = new ArrayList<>();

        for (Long categoryId : categoryIds) {
            scoreItems.addAll(
                    scoreItemRepository.findByScoreCategoryId(categoryId));
        }

        Map<Long, List<ScoreItem>> itemsByCategory = new HashMap<>();
        for (Long catId : categoryIds) {
            itemsByCategory.put(catId, scoreItemRepository.findByScoreCategoryId(catId));
        }

        // Get all enrolled students
        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);

        // Get all student scores for this course
        List<Long> allScoreItemIds = scoreItems.stream()
                .map(ScoreItem::getId)
                .collect(Collectors.toList());

        Map<Long, List<StudentScore>> scoresByItem = new HashMap<>();
        if (!allScoreItemIds.isEmpty()) {
            List<StudentScore> allScores = studentScoreRepository.findByScoreItemIdIn(allScoreItemIds);
            for (ScoreItem item : scoreItems) {
                scoresByItem.put(item.getId(),
                        allScores.stream()
                                .filter(s -> s.getScoreItem().getId().equals(item.getId()))
                                .collect(Collectors.toList()));
            }
        }

        // Build response
        GradebookResponse response = new GradebookResponse();
        response.setCourseId(courseId);
        response.setCourseName(course.getName());

        // Convert categories to DTOs
        response.setCategories(categories.stream()
                .map(cat -> new ScoreCategoryDTO(cat.getId(), cat.getName(), cat.getWeight()))
                .collect(Collectors.toList()));

        // Convert all score items to DTOs
        List<ScoreItemDTO> allItems = new java.util.ArrayList<>();
        for (List<ScoreItem> items : itemsByCategory.values()) {
            allItems.addAll(items.stream()
                    .map(item -> new ScoreItemDTO(item.getId(), item.getName(),
                            item.getScoreCategory().getId(),
                            item.getAssignment() != null ? item.getAssignment().getId() : null))
                    .collect(Collectors.toList()));
        }
        response.setScoreItems(allItems);

        // Build student rows
        List<StudentGradebookRowDTO> studentRows = new java.util.ArrayList<>();
        for (Enrollment enrollment : enrollments) {
            StudentGradebookRowDTO row = new StudentGradebookRowDTO();
            row.setStudentId(enrollment.getStudent().getId());
            row.setFirstName(enrollment.getStudent().getFirstName());
            row.setLastName(enrollment.getStudent().getLastName());

            // Get scores for this student
            Map<Long, Integer> scores = new HashMap<>();
            for (ScoreItem item : allItems.stream()
                    .map(dto -> scoreItems.stream()
                            .filter(si -> si.getId().equals(dto.getId()))
                            .findFirst()
                            .orElse(null))
                    .filter(item -> item != null)
                    .collect(Collectors.toList())) {
                StudentScore score = studentScoreRepository
                        .findByStudentIdAndScoreItemId(enrollment.getStudent().getId(), item.getId())
                        .orElse(null);
                scores.put(item.getId(), score != null ? score.getScore() : null);
            }
            row.setScores(scores);

            // Calculate category averages
            Map<Long, Double> categoryAverages = calculateCategoryAverages(enrollment.getStudent().getId(),
                    categoryIds, scoreItems);
            row.setCategoryAverages(categoryAverages);

            // Calculate final score
            Double finalScore = calculateFinalScore(enrollment.getStudent().getId(), categories, categoryAverages);
            row.setFinalScore(finalScore);

            studentRows.add(row);
        }

        response.setStudents(studentRows);
        response.setTotalWeight(scoreCategoryService.calculateTotalWeight(courseId));
        response.setWeightComplete(scoreCategoryService.isWeightComplete(courseId));

        return response;
    }

    /**
     * Calculate category averages for a student
     */
    private Map<Long, Double> calculateCategoryAverages(Long studentId, List<Long> categoryIds,
            List<ScoreItem> allScoreItems) {
        Map<Long, Double> averages = new HashMap<>();

        for (Long categoryId : categoryIds) {
            List<ScoreItem> categoryItems = allScoreItems.stream()
                    .filter(item -> item.getScoreCategory().getId().equals(categoryId))
                    .collect(Collectors.toList());

            if (categoryItems.isEmpty()) {
                averages.put(categoryId, null);
                continue;
            }

            List<Integer> scores = new java.util.ArrayList<>();
            for (ScoreItem item : categoryItems) {
                StudentScore score = studentScoreRepository
                        .findByStudentIdAndScoreItemId(studentId, item.getId())
                        .orElse(null);
                if (score != null && score.getScore() != null) {
                    scores.add(score.getScore());
                }
            }

            if (scores.isEmpty()) {
                averages.put(categoryId, null);
            } else {
                double avg = scores.stream()
                        .mapToInt(Integer::intValue)
                        .average()
                        .orElse(0.0);
                averages.put(categoryId, avg);
            }
        }

        return averages;
    }

    /**
     * Calculate final score for a student
     */
    private Double calculateFinalScore(Long studentId, List<ScoreCategory> categories,
            Map<Long, Double> categoryAverages) {
        int totalWeight = 0;
        double weightedSum = 0;

        for (ScoreCategory category : categories) {
            Double average = categoryAverages.get(category.getId());
            if (average == null) {
                continue;
            }

            Integer weight = category.getWeight();
            if (weight == null) {
                weight = 0;
            }

            totalWeight += weight;
            weightedSum += average * weight;
        }

        if (totalWeight == 0) {
            return null;
        }

        return weightedSum / totalWeight;
    }
}
