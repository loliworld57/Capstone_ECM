package com.extracenter.backend.dto;

import java.util.List;

public class StudentQuestionDTO {
    private Long id;
    private String questionText;
    private List<String> options;

    public StudentQuestionDTO() {
    }

    public StudentQuestionDTO(Long id, String questionText, List<String> options) {
        this.id = id;
        this.questionText = questionText;
        this.options = options;
    }

    public Long getId() {
        return id;
    }

    public String getQuestionText() {
        return questionText;
    }

    public List<String> getOptions() {
        return options;
    }
}