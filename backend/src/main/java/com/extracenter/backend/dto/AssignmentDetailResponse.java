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
public class AssignmentDetailResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime dueDate;
    private String fileUrl;
    private String fileName;
    private LocalDateTime createdDate;
}

