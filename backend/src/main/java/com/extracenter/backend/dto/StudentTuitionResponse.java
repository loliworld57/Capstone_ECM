package com.extracenter.backend.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentTuitionResponse {

    private Long courseId;
    private String courseName;

    // Tuition fee baseline
    private Long tuitionFeeVnd;

    // From enrollment.scholarship.discountPercentage
    private Float scholarshipDiscountPercentage;
    private Long scholarshipDiscountVnd;

    private Long finalTuitionVnd;

    private Long totalPaidVnd;
    private Long remainingVnd;

    private com.extracenter.backend.entity.TuitionStatus tuitionStatus; // PAID / PARTIAL / UNPAID



    private List<PaymentHistoryItem> paymentHistory;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentHistoryItem {
        private LocalDate paidAt;
        private Long amountVnd;
        private String note;
        private Long recordedByUserId;
    }
}

