package com.extracenter.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class CreateQuizRequest {
    private String title;
    private Long courseId;
    private Long materialId;
    private Long scoreItemId;
    private Integer maxAttempts;
    private Boolean isGraded;
    private LocalDateTime dueDate;
    private List<QuizQuestionDTO> questions;
    private Integer durationInMinutes;

    public Integer getDurationInMinutes() {
        return durationInMinutes;
    }

    public void setDurationInMinutes(Integer durationInMinutes) {
        this.durationInMinutes = durationInMinutes;
    }

}