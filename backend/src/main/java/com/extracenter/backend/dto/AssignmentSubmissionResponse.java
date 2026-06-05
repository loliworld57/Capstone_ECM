package com.extracenter.backend.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentSubmissionResponse {
    private Long id;
    private Long assignmentId;
    private Long studentId;
    private String fileUrl;
    private String fileName;
    private LocalDateTime submittedAt;
    private String status;
    private Float score;
    private String feedback;
}
