package com.extracenter.backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.extracenter.backend.entity.CenterFinanceRecord;
import com.extracenter.backend.entity.FinanceType;

@Repository
public interface CenterFinanceRecordRepository extends JpaRepository<CenterFinanceRecord, Long> {

    List<CenterFinanceRecord> findByCenterIdAndDateBetween(Long centerId, LocalDate start, LocalDate end);

    List<CenterFinanceRecord> findByCenterIdAndTypeAndDateBetween(Long centerId, FinanceType type, LocalDate start, LocalDate end);
}

