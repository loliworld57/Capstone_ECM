package com.extracenter.backend.dto;

import java.time.LocalDate;
import java.util.List;

import com.extracenter.backend.entity.InstallmentStatus;
import com.extracenter.backend.entity.PaymentPlanType;
import com.extracenter.backend.entity.TuitionStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentTuitionResponse {

    private Long enrollmentId;
    private Long tuitionAccountId;
    private Long courseId;
    private String courseName;

    private PaymentPlanType paymentPlanType;

    // Tuition fee baseline
    private Long tuitionFeeVnd;

    // From enrollment.scholarship.discountPercentage
    private Float scholarshipDiscountPercentage;
    private Long scholarshipDiscountVnd;

    private Long finalTuitionVnd;

    private Long totalPaidVnd;
    private Long remainingVnd;

    private TuitionStatus tuitionStatus; // PAID / PARTIAL / UNPAID / OVERDUE

    private List<InstallmentItem> installments;
    private List<PaymentHistoryItem> paymentHistory;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InstallmentItem {
        private Long id;
        private Integer installmentNumber;
        private LocalDate dueDate;
        private Long amountDueVnd;
        private Long amountPaidVnd;
        private Long remainingVnd;
        private InstallmentStatus status;
        private Long enrollmentId;
        private String studentName;
        private String courseName;
    }

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

