package com.extracenter.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentScoreResponse {

    private Long id;
    private Long studentId;
    private Long scoreItemId;
    private Integer score;
}
