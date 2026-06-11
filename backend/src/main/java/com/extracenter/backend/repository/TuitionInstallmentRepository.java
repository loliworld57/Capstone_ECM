package com.extracenter.backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.extracenter.backend.entity.InstallmentStatus;
import com.extracenter.backend.entity.TuitionInstallment;

@Repository
public interface TuitionInstallmentRepository extends JpaRepository<TuitionInstallment, Long> {

    List<TuitionInstallment> findByTuitionAccountIdOrderByDueDateAscInstallmentNumberAsc(Long tuitionAccountId);

    List<TuitionInstallment> findByTuitionAccountEnrollmentIdOrderByDueDateAscInstallmentNumberAsc(Long enrollmentId);

    @Modifying
    void deleteByTuitionAccountId(Long tuitionAccountId);

    @Query("""
        select coalesce(sum(i.amountDueVnd - i.amountPaidVnd), 0)
        from TuitionInstallment i
        where i.tuitionAccount.enrollment.course.center.id = :centerId
          and i.status in :statuses
    """)
    Long sumOutstandingByCenterIdAndStatuses(
            @Param("centerId") Long centerId,
            @Param("statuses") List<InstallmentStatus> statuses);

    @Query("""
        select i
        from TuitionInstallment i
        where i.tuitionAccount.enrollment.course.center.id = :centerId
          and i.dueDate < :today
          and i.status <> com.extracenter.backend.entity.InstallmentStatus.PAID
        order by i.dueDate asc
    """)
    List<TuitionInstallment> findOverdueByCenterId(
            @Param("centerId") Long centerId,
            @Param("today") LocalDate today);
}
