package com.extracenter.backend.dto;

import java.time.LocalDate;

import com.extracenter.backend.entity.FinanceType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceRecordRequest {

    @NotBlank
    private String name;

    @NotNull
    private FinanceType type;

    @NotNull
    @Positive
    private Long amountVnd;

    private String description;

    @NotNull
    private LocalDate date;
}

