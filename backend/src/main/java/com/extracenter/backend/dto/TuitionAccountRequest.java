package com.extracenter.backend.dto;

import java.time.LocalDate;
import java.util.List;

import com.extracenter.backend.entity.PaymentPlanType;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TuitionAccountRequest {

    @NotNull
    private Long enrollmentId;

    @NotNull
    private PaymentPlanType paymentPlanType;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer totalSessions;

    private Integer purchasedSessions;

    @Positive
    private Long monthlyAmountVnd;

    @Valid
    private List<InstallmentRequest> installments;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InstallmentRequest {
        @NotNull
        private LocalDate dueDate;

        @NotNull
        @Positive
        private Long amountDueVnd;
    }
}
