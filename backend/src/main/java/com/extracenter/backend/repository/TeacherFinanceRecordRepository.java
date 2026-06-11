package com.extracenter.backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.extracenter.backend.entity.FinanceType;
import com.extracenter.backend.entity.TeacherFinanceRecord;
import com.extracenter.backend.entity.User;
import org.springframework.stereotype.Repository;

@Repository
public interface TeacherFinanceRecordRepository extends JpaRepository<TeacherFinanceRecord, Long> {

    List<TeacherFinanceRecord> findByTeacherIdAndDateBetween(Long teacherId, LocalDate start, LocalDate end);

    List<TeacherFinanceRecord> findByTeacherIdAndTypeAndDateBetween(Long teacherId, FinanceType type, LocalDate start, LocalDate end);

    List<TeacherFinanceRecord> findByTeacherAndCreatedAtBetween(User teacher, LocalDate start, LocalDate end);
}

