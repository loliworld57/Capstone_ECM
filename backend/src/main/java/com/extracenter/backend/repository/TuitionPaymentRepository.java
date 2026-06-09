package com.extracenter.backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.extracenter.backend.entity.Enrollment;
import com.extracenter.backend.entity.TuitionPayment;

@Repository
public interface TuitionPaymentRepository extends JpaRepository<TuitionPayment, Long> {

    List<TuitionPayment> findByEnrollmentIdOrderByPaidAtAsc(Long enrollmentId);

    List<TuitionPayment> findByEnrollmentAndPaidAtBetween(Enrollment enrollment, LocalDate start, LocalDate end);
}

