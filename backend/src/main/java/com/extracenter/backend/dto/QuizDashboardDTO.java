package com.extracenter.backend.dto;

import java.time.LocalDateTime;

public class QuizDashboardDTO {
    private Long id;
    private String title;
    private LocalDateTime dueDate;
    private int maxAttempts;
    private boolean isGraded;
    private Integer highestScore; // null if never taken
    private Integer totalQuestions; // null if never taken
    private long attemptsTaken;

    public QuizDashboardDTO(Long id, String title, LocalDateTime dueDate, int maxAttempts,
            boolean isGraded, Integer highestScore, Integer totalQuestions, long attemptsTaken) {
        this.id = id;
        this.title = title;
        this.dueDate = dueDate;
        this.maxAttempts = maxAttempts;
        this.isGraded = isGraded;
        this.highestScore = highestScore;
        this.totalQuestions = totalQuestions;
        this.attemptsTaken = attemptsTaken;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public LocalDateTime getDueDate() {
        return dueDate;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public boolean isGraded() {
        return isGraded;
    }

    public Integer getHighestScore() {
        return highestScore;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public long getAttemptsTaken() {
        return attemptsTaken;
    }
}