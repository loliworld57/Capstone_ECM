package com.extracenter.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.dto.TuitionPaymentRequest;
import com.extracenter.backend.entity.Enrollment;
import com.extracenter.backend.entity.TuitionPayment;
import com.extracenter.backend.entity.User;
import com.extracenter.backend.repository.EnrollmentRepository;
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

    @Transactional
    public TuitionPayment createPayment(TuitionPaymentRequest request) {
        if (request.getAmountVnd() == null || request.getAmountVnd() <= 0) {
            throw new RuntimeException("amountVnd must be > 0");
        }


        Enrollment enrollment = enrollmentRepository.findById(request.getEnrollmentId())
                .orElseThrow(() -> new RuntimeException("Enrollment not found: " + request.getEnrollmentId()));

        User actor = userRepository.findById(request.getRecordedByUserId())
                .orElseThrow(() -> new RuntimeException("Actor/recorder user not found: " + request.getRecordedByUserId()));

        TuitionPayment payment = new TuitionPayment();
        payment.setEnrollment(enrollment);
        payment.setAmountVnd(request.getAmountVnd());
        payment.setPaidAt(request.getPaidAt());
        payment.setNote(request.getNote());
        payment.setRecordedBy(actor);
        payment.setCreatedAt(LocalDateTime.now());

        return tuitionPaymentRepository.save(payment);
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

        User actor = userRepository.findById(request.getRecordedByUserId())
                .orElseThrow(() -> new RuntimeException("Actor/recorder user not found: " + request.getRecordedByUserId()));

        existing.setAmountVnd(request.getAmountVnd());
        existing.setPaidAt(request.getPaidAt() != null ? request.getPaidAt() : existing.getPaidAt());
        existing.setNote(request.getNote());
        existing.setRecordedBy(actor);

        return tuitionPaymentRepository.save(existing);
    }

    @Transactional
    public void deletePayment(Long paymentId, Long actorUserId) {
        TuitionPayment existing = tuitionPaymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("TuitionPayment not found: " + paymentId));

        // Minimal ownership rule for now: actor must be the recorder
        // (Authorization can be tightened later using SecurityContext)
        if (existing.getRecordedBy() == null || !existing.getRecordedBy().getId().equals(actorUserId)) {
            throw new RuntimeException("You do not have permission to delete this payment.");
        }

        tuitionPaymentRepository.delete(existing);
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
}

