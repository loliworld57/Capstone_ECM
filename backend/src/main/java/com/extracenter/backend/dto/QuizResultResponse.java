package com.extracenter.backend.dto;

public class QuizResultResponse {
    private int score;
    private int totalQuestions;

    public QuizResultResponse(int score, int totalQuestions) {
        this.score = score;
        this.totalQuestions = totalQuestions;
    }

    public int getScore() {
        return score;
    }

    public int getTotalQuestions() {
        return totalQuestions;
    }
}