package com.extracenter.backend.service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.extracenter.backend.dto.StudentTuitionResponse;
import com.extracenter.backend.dto.StudentTuitionResponse.InstallmentItem;
import com.extracenter.backend.dto.StudentTuitionResponse.PaymentHistoryItem;
import com.extracenter.backend.entity.Enrollment;
import com.extracenter.backend.entity.PaymentPlanType;
import com.extracenter.backend.entity.Scholarship;
import com.extracenter.backend.entity.TuitionAccount;
import com.extracenter.backend.entity.TuitionInstallment;
import com.extracenter.backend.entity.TuitionPayment;
import com.extracenter.backend.repository.EnrollmentRepository;
import com.extracenter.backend.repository.TuitionAccountRepository;
import com.extracenter.backend.repository.TuitionInstallmentRepository;
import com.extracenter.backend.repository.TuitionPaymentRepository;
import com.extracenter.backend.repository.UserRepository;

@Service
public class TuitionService {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private TuitionPaymentRepository tuitionPaymentRepository;

    @Autowired
    private TuitionAccountRepository tuitionAccountRepository;

    @Autowired
    private TuitionInstallmentRepository tuitionInstallmentRepository;

    @Autowired
    private TuitionAccountService tuitionAccountService;

    @Autowired
    private UserRepository userRepository;

    public List<StudentTuitionResponse> getTuitionForStudent(Long studentId) {
        assertStudentCanAccess(studentId);
        List<Enrollment> enrollments = enrollmentRepository.findByStudentIdAndArchivedAtIsNull(studentId);

        return enrollments.stream()
                .map(this::mapEnrollmentToStudentTuitionResponse)
                .toList();
    }

    public List<StudentTuitionResponse> getTuitionForCurrentStudent() {
        var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Authentication is required");
        }

        Long studentId = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"))
                .getId();

        return getTuitionForStudent(studentId);
    }

    private void assertStudentCanAccess(Long studentId) {
        var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return;
        }

        boolean isStudent = authentication.getAuthorities().stream()
                .anyMatch(a -> "STUDENT".equals(a.getAuthority()) || "ROLE_STUDENT".equals(a.getAuthority()));
        if (!isStudent) {
            return;
        }

        Long currentUserId = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"))
                .getId();
        if (!currentUserId.equals(studentId)) {
            throw new RuntimeException("You can only view your own tuition.");
        }
    }

    private StudentTuitionResponse mapEnrollmentToStudentTuitionResponse(Enrollment enrollment) {
        var course = enrollment.getCourse();

        Long tuitionFeeVnd = course.getTuitionFeeVnd() != null ? course.getTuitionFeeVnd() : 0L;

        Scholarship scholarship = enrollment.getScholarship();
        Float scholarshipDiscountPercentage = scholarship != null ? scholarship.getDiscountPercentage() : 0f;
        Long scholarshipDiscountVnd = tuitionAccountService.calculateDiscountVnd(tuitionFeeVnd, scholarshipDiscountPercentage);

        Long finalTuitionVnd = tuitionFeeVnd - scholarshipDiscountVnd;
        if (finalTuitionVnd < 0) {
            finalTuitionVnd = 0L;
        }

        TuitionAccount account = tuitionAccountRepository.findByEnrollmentId(enrollment.getId()).orElse(null);
        if (account != null) {
            tuitionAccountService.recalculateEnrollment(enrollment.getId());
            account = tuitionAccountRepository.findByEnrollmentId(enrollment.getId()).orElse(account);
            tuitionFeeVnd = account.getOriginalAmountVnd();
            scholarshipDiscountVnd = account.getScholarshipDiscountVnd();
            finalTuitionVnd = account.getFinalAmountVnd();
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

        com.extracenter.backend.entity.TuitionStatus status = account != null
                ? account.getStatus()
                : deriveStatus(totalPaidVnd, finalTuitionVnd);

        List<InstallmentItem> installments = account == null
                ? List.of()
                : tuitionInstallmentRepository.findByTuitionAccountIdOrderByDueDateAscInstallmentNumberAsc(account.getId())
                        .stream()
                        .map(this::mapInstallment)
                        .toList();

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
                .enrollmentId(enrollment.getId())
                .tuitionAccountId(account != null ? account.getId() : null)
                .courseId(course.getId())
                .courseName(course.getName())
                .paymentPlanType(account != null ? account.getPaymentPlanType() : PaymentPlanType.FULL_COURSE)
                .planStartDate(account != null ? account.getStartDate() : enrollment.getEnrollmentDate())
                .planEndDate(account != null ? account.getEndDate() : course.getEndDate())
                .totalSessions(account != null ? account.getTotalSessions() : null)
                .purchasedSessions(account != null ? account.getPurchasedSessions() : null)
                .tuitionFeeVnd(tuitionFeeVnd)
                .scholarshipDiscountPercentage(scholarshipDiscountPercentage)
                .scholarshipDiscountVnd(scholarshipDiscountVnd)
                .finalTuitionVnd(finalTuitionVnd)
                .totalPaidVnd(totalPaidVnd)
                .remainingVnd(remainingVnd)
                .tuitionStatus(status)
                .installments(installments)
                .paymentHistory(history)
                .build();
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

    private InstallmentItem mapInstallment(TuitionInstallment installment) {
        long amountDue = installment.getAmountDueVnd() != null ? installment.getAmountDueVnd() : 0L;
        long amountPaid = installment.getAmountPaidVnd() != null ? installment.getAmountPaidVnd() : 0L;
        return InstallmentItem.builder()
                .id(installment.getId())
                .installmentNumber(installment.getInstallmentNumber())
                .dueDate(installment.getDueDate())
                .amountDueVnd(amountDue)
                .amountPaidVnd(amountPaid)
                .remainingVnd(Math.max(0L, amountDue - amountPaid))
                .status(installment.getStatus())
                .build();
    }

    public boolean isTuitionCompletedForMonth(List<Enrollment> enrollments, YearMonth month) {
        // Placeholder for future: derive based on payments within month and final tuition.
        return false;
    }

    // Simple helper (avoid new dependency)
    public record YearMonth(int year, int month) {}
}

