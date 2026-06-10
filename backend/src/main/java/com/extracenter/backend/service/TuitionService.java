package com.extracenter.backend.service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.extracenter.backend.dto.StudentTuitionResponse;
import com.extracenter.backend.dto.StudentTuitionResponse.PaymentHistoryItem;
import com.extracenter.backend.entity.Enrollment;
import com.extracenter.backend.entity.Scholarship;
import com.extracenter.backend.entity.TuitionPayment;
import com.extracenter.backend.repository.EnrollmentRepository;
import com.extracenter.backend.repository.TuitionPaymentRepository;

@Service
public class TuitionService {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private TuitionPaymentRepository tuitionPaymentRepository;

    public List<StudentTuitionResponse> getTuitionForStudent(Long studentId) {
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);

        return enrollments.stream()
                .map(this::mapEnrollmentToStudentTuitionResponse)
                .toList();
    }

    private StudentTuitionResponse mapEnrollmentToStudentTuitionResponse(Enrollment enrollment) {
        var course = enrollment.getCourse();

        Long tuitionFeeVnd = course.getTuitionFeeVnd();

        Scholarship scholarship = enrollment.getScholarship();
        Float scholarshipDiscountPercentage = scholarship != null ? scholarship.getDiscountPercentage() : 0f;
        Long scholarshipDiscountVnd = calculateDiscountVnd(tuitionFeeVnd, scholarshipDiscountPercentage);

        Long finalTuitionVnd = tuitionFeeVnd - scholarshipDiscountVnd;
        if (finalTuitionVnd < 0) {
            finalTuitionVnd = 0L;
        }

        List<TuitionPayment> payments = tuitionPaymentRepository.findByEnrollmentIdOrderByPaidAtAsc(enrollment.getId());

        long totalPaidVnd = payments.stream()
                .filter(Objects::nonNull)
                .mapToLong(TuitionPayment::getAmountVnd)
                .sum();

        long remainingVnd = finalTuitionVnd - totalPaidVnd;
        if (remainingVnd < 0) {
            remainingVnd = 0;
        }

        com.extracenter.backend.entity.TuitionStatus status = deriveStatus(totalPaidVnd, finalTuitionVnd);

        List<PaymentHistoryItem> history = payments.stream()
                .map(p -> PaymentHistoryItem.builder()

                        .paidAt(p.getPaidAt())
                        .amountVnd(p.getAmountVnd())
                        .note(p.getNote())
                        .recordedByUserId(p.getRecordedBy() != null ? p.getRecordedBy().getId() : null)
                        .build())
                .sorted(Comparator.comparing(PaymentHistoryItem::getPaidAt))
                .toList();

        return StudentTuitionResponse.builder()
                .courseId(course.getId())
                .courseName(course.getName())
                .tuitionFeeVnd(tuitionFeeVnd)
                .scholarshipDiscountPercentage(scholarshipDiscountPercentage)
                .scholarshipDiscountVnd(scholarshipDiscountVnd)
                .finalTuitionVnd(finalTuitionVnd)
                .totalPaidVnd(totalPaidVnd)
                .remainingVnd(remainingVnd)
                .tuitionStatus(status)
                .paymentHistory(history)
                .build();
    }

    private Long calculateDiscountVnd(Long tuitionFeeVnd, Float discountPercentage) {
        if (tuitionFeeVnd == null) {
            return 0L;
        }
        if (discountPercentage == null || discountPercentage <= 0) {
            return 0L;
        }
        // discountPercentage is fractional e.g. 0.2 means 20%
        double discount = tuitionFeeVnd * discountPercentage;
        return (long) Math.round(discount);
    }

    private com.extracenter.backend.entity.TuitionStatus deriveStatus(long totalPaidVnd, long finalTuitionVnd) {
        if (finalTuitionVnd <= 0) {
            return com.extracenter.backend.entity.TuitionStatus.PAID;
        }
        if (totalPaidVnd <= 0) {
            return com.extracenter.backend.entity.TuitionStatus.UNPAID;
        }
        if (totalPaidVnd >= finalTuitionVnd) {
            return com.extracenter.backend.entity.TuitionStatus.PAID;
        }
        return com.extracenter.backend.entity.TuitionStatus.PARTIAL;
    }



    public List<TuitionPayment> listPaymentsForEnrollment(Long enrollmentId) {
        return tuitionPaymentRepository.findByEnrollmentIdOrderByPaidAtAsc(enrollmentId);
    }

    public boolean isTuitionCompletedForMonth(List<Enrollment> enrollments, YearMonth month) {
        // Placeholder for future: derive based on payments within month and final tuition.
        return false;
    }

    // Simple helper (avoid new dependency)
    public record YearMonth(int year, int month) {}
}

