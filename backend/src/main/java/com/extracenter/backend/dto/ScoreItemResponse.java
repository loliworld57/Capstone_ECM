package com.extracenter.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreItemResponse {
    private Long id;
    private String name;
    private Long scoreCategoryId;
    private Long assignmentId;
}