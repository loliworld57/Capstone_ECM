package com.extracenter.backend.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TuitionPaymentRequest {

    @NotNull
    private Long enrollmentId;

    @NotNull
    @Positive
    private Long amountVnd;

    @NotNull
    private LocalDate paidAt;

    private String note;
}

