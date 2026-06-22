package com.extracenter.backend.dto;

import java.util.List;

public class StudentQuizDTO {
    private Long id;
    private String title;
    private List<StudentQuestionDTO> questions;
    private Integer durationInMinutes;

    public StudentQuizDTO() {
    }

    public StudentQuizDTO(Long id, String title, List<StudentQuestionDTO> questions, Integer durationInMinutes) {
        this.id = id;
        this.title = title;
        this.questions = questions;
        this.durationInMinutes = durationInMinutes;
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

    public Integer getDurationInMinutes() {
        return durationInMinutes;
    }
}