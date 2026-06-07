package com.extracenter.backend.dto;

import java.time.LocalDateTime;

public class StudentAssignmentDTO {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime dueDate;

    // The specific student's data
    private String submissionStatus; // e.g., "NOT_SUBMITTED", "SUBMITTED", "SCORED"
    private LocalDateTime submittedAt;

    // Constructors, Getters, and Setters
    public StudentAssignmentDTO() {
    }

    // Add getters and setters for all fields
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }

    public String getSubmissionStatus() {
        return submissionStatus;
    }

    public void setSubmissionStatus(String submissionStatus) {
        this.submissionStatus = submissionStatus;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }
}