package com.extracenter.backend.dto;

import java.util.List;

import com.extracenter.backend.entity.CenterFinanceRecord;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinanceReportResponse {

    private Long totalIncomeVnd;
    private Long totalExpenseVnd;
    private Long profitVnd;

    // Optionally return raw records for UI
    private List<?> records;
}

