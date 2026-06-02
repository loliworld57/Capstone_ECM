package com.extracenter.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScoreItemRequest {

    @NotBlank(message = "Score item name is required")
    private String name;

    // Optional: link to an Assignment
    private Long assignmentId;

    // Optional: move this score item to a different category
    private Long scoreCategoryId;
}
