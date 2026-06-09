package com.extracenter.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.extracenter.backend.dto.TuitionPaymentRequest;
import com.extracenter.backend.entity.TuitionPayment;
import com.extracenter.backend.service.TuitionPaymentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tuition")
@CrossOrigin(originPatterns = "*")
public class TuitionPaymentController {

    @Autowired
    private TuitionPaymentService tuitionPaymentService;

    // POST: /api/tuition/payments
    @PostMapping("/payments")
    public ResponseEntity<?> createPayment(@Valid @RequestBody TuitionPaymentRequest request) {
        try {
            TuitionPayment created = tuitionPaymentService.createPayment(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT: /api/tuition/payments/{paymentId}
    @PutMapping("/payments/{paymentId}")
    public ResponseEntity<?> updatePayment(
            @PathVariable Long paymentId,
            @Valid @RequestBody TuitionPaymentRequest request) {
        try {
            TuitionPayment updated = tuitionPaymentService.updatePayment(paymentId, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE: /api/tuition/payments/{paymentId}?actorUserId=...
    @DeleteMapping("/payments/{paymentId}")
    public ResponseEntity<?> deletePayment(
            @PathVariable Long paymentId,
            @org.springframework.web.bind.annotation.RequestParam Long actorUserId) {
        try {
            tuitionPaymentService.deletePayment(paymentId, actorUserId);
            return ResponseEntity.ok(Map.of("message", "Payment deleted successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    // GET: /api/tuition/enrollments/{enrollmentId}/payments
    @GetMapping("/enrollments/{enrollmentId}/payments")
    public ResponseEntity<?> listPayments(@PathVariable Long enrollmentId) {
        try {
            List<TuitionPayment> payments = tuitionPaymentService.listPaymentsByEnrollment(enrollmentId);
            return ResponseEntity.ok(payments);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

