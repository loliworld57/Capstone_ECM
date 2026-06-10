package com.extracenter.backend.dto;

import java.util.List;

public class StudentQuizDTO {
    private Long id;
    private String title;
    private List<StudentQuestionDTO> questions;

    public StudentQuizDTO() {
    }

    public StudentQuizDTO(Long id, String title, List<StudentQuestionDTO> questions) {
        this.id = id;
        this.title = title;
        this.questions = questions;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public List<StudentQuestionDTO> getQuestions() {
        return questions;
    }
}