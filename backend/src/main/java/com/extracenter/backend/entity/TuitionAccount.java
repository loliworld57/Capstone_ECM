package com.extracenter.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "TuitionAccount")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class TuitionAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false, unique = true)
    @JsonIgnore
    private Enrollment enrollment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentPlanType paymentPlanType = PaymentPlanType.FULL_COURSE;

    @Column(nullable = false)
    private Long originalAmountVnd = 0L;

    @Column(nullable = false)
    private Long scholarshipDiscountVnd = 0L;

    @Column(nullable = false)
    private Long finalAmountVnd = 0L;

    private Integer totalSessions;

    private Integer purchasedSessions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TuitionStatus status = TuitionStatus.UNPAID;

    private LocalDate startDate;

    private LocalDate endDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
