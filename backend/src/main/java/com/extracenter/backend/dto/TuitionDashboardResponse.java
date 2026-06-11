package com.extracenter.backend.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TuitionDashboardResponse {

    private Long monthlyRevenueVnd;
    private Long monthlyExpenseVnd;
    private Long estimatedProfitVnd;
    private Long outstandingDebtVnd;
    private Integer overduePaymentCount;
    private List<StudentTuitionResponse.InstallmentItem> overduePayments;
}
