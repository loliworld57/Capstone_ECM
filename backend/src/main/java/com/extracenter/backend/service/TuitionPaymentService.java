package com.extracenter.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.dto.TuitionPaymentRequest;
import com.extracenter.backend.entity.Enrollment;
import com.extracenter.backend.entity.TuitionInstallment;
import com.extracenter.backend.entity.TuitionPayment;
import com.extracenter.backend.entity.User;
import com.extracenter.backend.repository.EnrollmentRepository;
import com.extracenter.backend.repository.TuitionInstallmentRepository;
import com.extracenter.backend.repository.TuitionPaymentRepository;
import com.extracenter.backend.repository.UserRepository;

@Service
public class TuitionPaymentService {

    @Autowired
    private TuitionPaymentRepository tuitionPaymentRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TuitionInstallmentRepository tuitionInstallmentRepository;

    @Autowired
    private TuitionAccountService tuitionAccountService;

    private User getCurrentUser() {
        var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Authentication is required");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }



    @Transactional
    public TuitionPayment createPayment(TuitionPaymentRequest request) {
        if (request.getAmountVnd() == null || request.getAmountVnd() <= 0) {
            throw new RuntimeException("amountVnd must be > 0");
        }


        Enrollment enrollment = enrollmentRepository.findById(request.getEnrollmentId())
                .orElseThrow(() -> new RuntimeException("Enrollment not found: " + request.getEnrollmentId()));

        User currentUser = getCurrentUser();

        TuitionPayment payment = new TuitionPayment();

        payment.setEnrollment(enrollment);
        payment.setAmountVnd(request.getAmountVnd());
        payment.setPaidAt(request.getPaidAt());
        payment.setNote(request.getNote());
        payment.setRecordedBy(currentUser);
        payment.setInstallment(resolveInstallment(request.getInstallmentId(), enrollment.getId()));

        payment.setCreatedAt(LocalDateTime.now());

        TuitionPayment saved = tuitionPaymentRepository.save(payment);
        tuitionAccountService.recalculateEnrollment(enrollment.getId());
        return saved;
    }

    @Transactional
    public TuitionPayment updatePayment(Long paymentId, TuitionPaymentRequest request) {
        TuitionPayment existing = tuitionPaymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("TuitionPayment not found: " + paymentId));

        // Prevent changing enrollment when updating (keeps accounting consistent)
        if (!existing.getEnrollment().getId().equals(request.getEnrollmentId())) {
            throw new RuntimeException("Cannot change enrollment for an existing payment.");
        }

        if (request.getAmountVnd() == null || request.getAmountVnd() <= 0) {
            throw new RuntimeException("amountVnd must be > 0");
        }

        Enrollment enrollment = enrollmentRepository.findById(request.getEnrollmentId())
                .orElseThrow(() -> new RuntimeException("Enrollment not found: " + request.getEnrollmentId()));
        existing.setEnrollment(enrollment);

        User currentUser = getCurrentUser();

        existing.setAmountVnd(request.getAmountVnd());

        existing.setPaidAt(request.getPaidAt() != null ? request.getPaidAt() : existing.getPaidAt());
        existing.setNote(request.getNote());
        existing.setRecordedBy(currentUser);
        existing.setInstallment(resolveInstallment(request.getInstallmentId(), enrollment.getId()));


        TuitionPayment saved = tuitionPaymentRepository.save(existing);
        tuitionAccountService.recalculateEnrollment(enrollment.getId());
        return saved;
    }

    @Transactional
    public void deletePayment(Long paymentId) {
        Long currentUserId = getCurrentUser().getId();


        TuitionPayment existing = tuitionPaymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("TuitionPayment not found: " + paymentId));

        // Minimal ownership rule for now: actor must be the recorder
        // (Authorization can be tightened later using SecurityContext)
        if (existing.getRecordedBy() == null || !existing.getRecordedBy().getId().equals(currentUserId)) {

            throw new RuntimeException("You do not have permission to delete this payment.");
        }

        Long enrollmentId = existing.getEnrollment().getId();
        tuitionPaymentRepository.delete(existing);
        tuitionAccountService.recalculateEnrollment(enrollmentId);
    }

    @Transactional(readOnly = true)
    public List<TuitionPayment> listPaymentsByEnrollment(Long enrollmentId) {
        // Ensure enrollment exists (nice error message)
        enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found: " + enrollmentId));
        return tuitionPaymentRepository.findByEnrollmentIdOrderByPaidAtAsc(enrollmentId);
    }

    public void validatePaidAtNotNull(LocalDate paidAt) {
        if (paidAt == null) {
            throw new RuntimeException("paidAt is required");
        }
    }

    private TuitionInstallment resolveInstallment(Long installmentId, Long enrollmentId) {
        if (installmentId == null) {
            return null;
        }
        TuitionInstallment installment = tuitionInstallmentRepository.findById(installmentId)
                .orElseThrow(() -> new RuntimeException("Tuition installment not found: " + installmentId));
        Long installmentEnrollmentId = installment.getTuitionAccount().getEnrollment().getId();
        if (!installmentEnrollmentId.equals(enrollmentId)) {
            throw new RuntimeException("Installment does not belong to this enrollment.");
        }
        return installment;
    }
}

