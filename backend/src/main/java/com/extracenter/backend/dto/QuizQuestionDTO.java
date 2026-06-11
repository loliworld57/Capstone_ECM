package com.extracenter.backend.dto;

import java.util.List;

public class QuizQuestionDTO {
    private String question;
    private List<String> options;
    private String correctAnswer; 
    private String explanation; 

    // Constructors
    public QuizQuestionDTO() {}

    // Getters and Setters
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
}