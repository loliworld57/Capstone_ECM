package com.extracenter.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class CreateQuizRequest {
    private String title;
    private Long courseId;
    private Long materialId;
    private Integer maxAttempts;
    private Boolean isGraded;
    private LocalDateTime dueDate;
    private List<QuizQuestionDTO> questions;

}