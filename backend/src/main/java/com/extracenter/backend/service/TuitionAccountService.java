package com.extracenter.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.dto.TuitionAccountRequest;
import com.extracenter.backend.entity.Enrollment;
import com.extracenter.backend.entity.InstallmentStatus;
import com.extracenter.backend.entity.PaymentPlanType;
import com.extracenter.backend.entity.Scholarship;
import com.extracenter.backend.entity.TuitionAccount;
import com.extracenter.backend.entity.TuitionInstallment;
import com.extracenter.backend.entity.TuitionPayment;
import com.extracenter.backend.entity.TuitionStatus;
import com.extracenter.backend.repository.EnrollmentRepository;
import com.extracenter.backend.repository.TuitionAccountRepository;
import com.extracenter.backend.repository.TuitionInstallmentRepository;
import com.extracenter.backend.repository.TuitionPaymentRepository;

@Service
public class TuitionAccountService {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private TuitionAccountRepository tuitionAccountRepository;

    @Autowired
    private TuitionInstallmentRepository tuitionInstallmentRepository;

    @Autowired
    private TuitionPaymentRepository tuitionPaymentRepository;

    @Transactional
    public TuitionAccount createDefaultAccount(Enrollment enrollment) {
        return tuitionAccountRepository.findByEnrollmentId(enrollment.getId())
                .orElseGet(() -> {
                    TuitionAccount account = buildBaseAccount(enrollment, PaymentPlanType.FULL_COURSE,
                            enrollment.getEnrollmentDate(), enrollment.getCourse().getEndDate());
                    TuitionAccount saved = tuitionAccountRepository.save(account);
                    replaceInstallments(saved, List.of(newInstallment(saved, 1,
                            account.getStartDate() != null ? account.getStartDate() : LocalDate.now(),
                            account.getFinalAmountVnd())));
                    recalculateEnrollment(enrollment.getId());
                    return saved;
                });
    }

    @Transactional
    public TuitionAccount createOrUpdateAccount(TuitionAccountRequest request) {
        Enrollment enrollment = enrollmentRepository.findById(request.getEnrollmentId())
                .orElseThrow(() -> new RuntimeException("Enrollment not found: " + request.getEnrollmentId()));

        TuitionAccount account = tuitionAccountRepository.findByEnrollmentId(enrollment.getId())
                .orElseGet(TuitionAccount::new);

        TuitionAccount base = buildBaseAccount(enrollment, request.getPaymentPlanType(), request.getStartDate(), request.getEndDate());
        account.setEnrollment(enrollment);
        account.setPaymentPlanType(base.getPaymentPlanType());
        account.setOriginalAmountVnd(base.getOriginalAmountVnd());
        account.setScholarshipDiscountVnd(base.getScholarshipDiscountVnd());
        account.setFinalAmountVnd(base.getFinalAmountVnd());
        account.setStartDate(base.getStartDate());
        account.setEndDate(base.getEndDate());
        account.setTotalSessions(request.getTotalSessions());
        account.setPurchasedSessions(request.getPurchasedSessions());
        account.setUpdatedAt(LocalDateTime.now());

        TuitionAccount saved = tuitionAccountRepository.save(account);
        replaceInstallments(saved, buildInstallments(saved, request));
        recalculateEnrollment(enrollment.getId());
        return saved;
    }

    @Transactional
    public void recalculateEnrollment(Long enrollmentId) {
        TuitionAccount account = tuitionAccountRepository.findByEnrollmentId(enrollmentId).orElse(null);
        if (account == null) {
            return;
        }

        List<TuitionInstallment> installments =
                tuitionInstallmentRepository.findByTuitionAccountIdOrderByDueDateAscInstallmentNumberAsc(account.getId());
        installments.forEach(i -> {
            i.setAmountPaidVnd(0L);
            i.setStatus(InstallmentStatus.PENDING);
        });

        List<TuitionPayment> payments = tuitionPaymentRepository.findByEnrollmentIdOrderByPaidAtAsc(enrollmentId);
        long totalPaid = payments.stream()
                .filter(p -> p.getAmountVnd() != null)
                .mapToLong(TuitionPayment::getAmountVnd)
                .sum();

        long unapplied = totalPaid;
        for (TuitionInstallment installment : installments) {
            long due = safe(installment.getAmountDueVnd());
            long paid = Math.min(unapplied, due);
            installment.setAmountPaidVnd(paid);
            unapplied -= paid;
            installment.setStatus(deriveInstallmentStatus(due, paid, installment.getDueDate()));
        }

        tuitionInstallmentRepository.saveAll(installments);

        account.setStatus(deriveAccountStatus(account.getFinalAmountVnd(), totalPaid, installments));
        account.setUpdatedAt(LocalDateTime.now());
        tuitionAccountRepository.save(account);
    }

    public Long calculateDiscountVnd(Long tuitionFeeVnd, Float discountPercentage) {
        if (tuitionFeeVnd == null || discountPercentage == null || discountPercentage <= 0) {
            return 0L;
        }
        return Math.round(tuitionFeeVnd * discountPercentage);
    }

    private TuitionAccount buildBaseAccount(Enrollment enrollment, PaymentPlanType paymentPlanType, LocalDate startDate, LocalDate endDate) {
        Long originalAmount = enrollment.getCourse().getTuitionFeeVnd() != null ? enrollment.getCourse().getTuitionFeeVnd() : 0L;
        Scholarship scholarship = enrollment.getScholarship();
        Float discountPercentage = scholarship != null ? scholarship.getDiscountPercentage() : 0f;
        Long discountVnd = calculateDiscountVnd(originalAmount, discountPercentage);
        Long finalAmount = Math.max(0L, originalAmount - discountVnd);

        TuitionAccount account = new TuitionAccount();
        account.setEnrollment(enrollment);
        account.setPaymentPlanType(paymentPlanType != null ? paymentPlanType : PaymentPlanType.FULL_COURSE);
        account.setOriginalAmountVnd(originalAmount);
        account.setScholarshipDiscountVnd(discountVnd);
        account.setFinalAmountVnd(finalAmount);
        account.setStartDate(startDate != null ? startDate : enrollment.getEnrollmentDate());
        account.setEndDate(endDate != null ? endDate : enrollment.getCourse().getEndDate());
        return account;
    }

    private List<TuitionInstallment> buildInstallments(TuitionAccount account, TuitionAccountRequest request) {
        PaymentPlanType planType = account.getPaymentPlanType();
        if (planType == PaymentPlanType.CUSTOM_PLAN) {
            if (request.getInstallments() == null || request.getInstallments().isEmpty()) {
                throw new RuntimeException("Custom plan requires at least one installment.");
            }
            List<TuitionInstallment> installments = new ArrayList<>();
            int number = 1;
            for (TuitionAccountRequest.InstallmentRequest item : request.getInstallments()) {
                installments.add(newInstallment(account, number++, item.getDueDate(), item.getAmountDueVnd()));
            }
            return installments;
        }

        if (planType == PaymentPlanType.MONTHLY) {
            LocalDate start = account.getStartDate() != null ? account.getStartDate() : LocalDate.now();
            LocalDate end = account.getEndDate() != null ? account.getEndDate() : start;
            long monthCount = Math.max(1, ChronoUnit.MONTHS.between(start.withDayOfMonth(1), end.withDayOfMonth(1)) + 1);
            long monthlyAmount = request.getMonthlyAmountVnd() != null
                    ? request.getMonthlyAmountVnd()
                    : Math.round((double) account.getFinalAmountVnd() / monthCount);
            List<TuitionInstallment> installments = new ArrayList<>();
            long remaining = account.getFinalAmountVnd();
            for (int i = 1; i <= monthCount; i++) {
                long amount = i == monthCount ? remaining : Math.min(monthlyAmount, remaining);
                installments.add(newInstallment(account, i, start.plusMonths(i - 1), amount));
                remaining -= amount;
            }
            return installments;
        }

        return List.of(newInstallment(account, 1,
                account.getStartDate() != null ? account.getStartDate() : LocalDate.now(),
                account.getFinalAmountVnd()));
    }

    private TuitionInstallment newInstallment(TuitionAccount account, int number, LocalDate dueDate, Long amountDueVnd) {
        TuitionInstallment installment = new TuitionInstallment();
        installment.setTuitionAccount(account);
        installment.setInstallmentNumber(number);
        installment.setDueDate(dueDate != null ? dueDate : LocalDate.now());
        installment.setAmountDueVnd(amountDueVnd != null ? amountDueVnd : 0L);
        installment.setAmountPaidVnd(0L);
        installment.setStatus(InstallmentStatus.PENDING);
        return installment;
    }

    private void replaceInstallments(TuitionAccount account, List<TuitionInstallment> installments) {
        if (account.getId() != null) {
            tuitionInstallmentRepository.deleteByTuitionAccountId(account.getId());
        }
        tuitionInstallmentRepository.saveAll(installments);
    }

    private InstallmentStatus deriveInstallmentStatus(long due, long paid, LocalDate dueDate) {
        if (paid >= due) {
            return InstallmentStatus.PAID;
        }
        if (dueDate != null && dueDate.isBefore(LocalDate.now())) {
            return InstallmentStatus.OVERDUE;
        }
        if (paid > 0) {
            return InstallmentStatus.PARTIAL;
        }
        return InstallmentStatus.PENDING;
    }

    private TuitionStatus deriveAccountStatus(Long finalAmountVnd, long totalPaid, List<TuitionInstallment> installments) {
        long finalAmount = safe(finalAmountVnd);
        if (finalAmount <= 0 || totalPaid >= finalAmount) {
            return TuitionStatus.PAID;
        }
        boolean hasOverdue = installments.stream()
                .anyMatch(i -> i.getStatus() == InstallmentStatus.OVERDUE);
        if (hasOverdue) {
            return TuitionStatus.OVERDUE;
        }
        return totalPaid > 0 ? TuitionStatus.PARTIAL : TuitionStatus.UNPAID;
    }

    private long safe(Long value) {
        return value != null ? value : 0L;
    }
}
