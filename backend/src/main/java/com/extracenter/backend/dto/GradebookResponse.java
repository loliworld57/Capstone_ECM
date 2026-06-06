package com.extracenter.backend.dto;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class GradebookResponse {

    private Long courseId;
    private String courseName;
    private List<ScoreCategoryDTO> categories;
    private List<ScoreItemDTO> scoreItems;
    private List<StudentGradebookRowDTO> students;
    private Integer totalWeight;
    private Boolean weightComplete;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreCategoryDTO {
        private Long id;
        private String name;
        private Integer weight;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreItemDTO {
        private Long id;
        private String name;
        private Long scoreCategoryId;
        private Long assignmentId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentGradebookRowDTO {
        private Long studentId;
        private String firstName;
        private String lastName;
        private Map<Long, Integer> scores; // scoreItemId -> score
        private Map<Long, Double> categoryAverages; // scoreCategoryId -> average
        private Double finalScore;
    }
}
