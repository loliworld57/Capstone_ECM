package com.extracenter.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class TeacherQuizReportDTO {
    // Summary Metrics
    private double averageScore;
    private int totalSubmissions;
    private int highestScore;
    private int lowestScore;
    private int totalQuestions;

    // Student Breakdown Roster
    private List<StudentResultRow> studentResults;

    public TeacherQuizReportDTO(double averageScore, int totalSubmissions, int highestScore,
            int lowestScore, int totalQuestions, List<StudentResultRow> studentResults) {
        this.averageScore = averageScore;
        this.totalSubmissions = totalSubmissions;
        this.highestScore = highestScore;
        this.lowestScore = lowestScore;
        this.totalQuestions = totalQuestions;
        this.studentResults = studentResults;
    }

    // Getters
    public double getAverageScore() {
        return averageScore;
    }

    public int getTotalSubmissions() {
        return totalSubmissions;
    }

    public int getHighestScore() {
        return highestScore;
    }

    public int getLowestScore() {
        return lowestScore;
    }

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public List<StudentResultRow> getStudentResults() {
        return studentResults;
    }

    // Nested class for individual rows
    public static class StudentResultRow {
        private Long studentId;
        private String studentName;
        private String email;
        private int highestScore;
        private long attemptsTaken;
        private LocalDateTime lastSubmittedAt;

        public StudentResultRow(Long studentId, String studentName, String email,
                int highestScore, long attemptsTaken, LocalDateTime lastSubmittedAt) {
            this.studentId = studentId;
            this.studentName = studentName;
            this.email = email;
            this.highestScore = highestScore;
            this.attemptsTaken = attemptsTaken;
            this.lastSubmittedAt = lastSubmittedAt;
        }

        public Long getStudentId() {
            return studentId;
        }

        public String getStudentName() {
            return studentName;
        }

        public String getEmail() {
            return email;
        }

        public int getHighestScore() {
            return highestScore;
        }

        public long getAttemptsTaken() {
            return attemptsTaken;
        }

        public LocalDateTime getLastSubmittedAt() {
            return lastSubmittedAt;
        }
    }
}