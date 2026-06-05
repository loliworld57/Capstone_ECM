package com.extracenter.backend.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StudentAssignmentResponse {

    private Long id;

    private String title;

    private String description;

    private LocalDateTime dueDate;

    private String fileUrl;

    private String fileName;

    private LocalDateTime createdDate;

    private String submissionStatus;

    private LocalDateTime submittedAt;
}