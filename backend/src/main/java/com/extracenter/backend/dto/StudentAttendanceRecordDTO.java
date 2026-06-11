package com.extracenter.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class StudentAttendanceRecordDTO {
    private Long sessionId;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String classroomLocation;
    private String status; // "ATTEND", "ABSENT", "LATE", "EXCUSE", or "NOT_TAKEN"

    public StudentAttendanceRecordDTO(Long sessionId, LocalDate date, LocalTime startTime,
            LocalTime endTime, String classroomLocation, String status) {
        this.sessionId = sessionId;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.classroomLocation = classroomLocation;
        this.status = status;
    }

    // Getters and Setters
    public Long getSessionId() {
        return sessionId;
    }

    public LocalDate getDate() {
        return date;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public String getClassroomLocation() {
        return classroomLocation;
    }

    public String getStatus() {
        return status;
    }
}