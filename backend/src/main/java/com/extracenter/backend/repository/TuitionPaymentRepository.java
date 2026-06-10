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

    @org.springframework.data.jpa.repository.Query("""
        select coalesce(sum(tp.amountVnd), 0)
        from TuitionPayment tp
        where tp.paidAt between :start and :end
          and tp.enrollment.course.center.id = :centerId
    """)
    Long sumTuitionRevenueByCenterIdAndPaidAtBetween(
            @org.springframework.data.repository.query.Param("centerId") Long centerId,
            @org.springframework.data.repository.query.Param("start") LocalDate start,
            @org.springframework.data.repository.query.Param("end") LocalDate end);

    @org.springframework.data.jpa.repository.Query("""
        select coalesce(sum(tp.amountVnd), 0)
        from TuitionPayment tp
        where tp.paidAt between :start and :end
          and tp.enrollment.course.id = :courseId
    """)
    Long sumTuitionRevenueByCourseIdAndPaidAtBetween(
            @org.springframework.data.repository.query.Param("courseId") Long courseId,
            @org.springframework.data.repository.query.Param("start") LocalDate start,
            @org.springframework.data.repository.query.Param("end") LocalDate end);
}


