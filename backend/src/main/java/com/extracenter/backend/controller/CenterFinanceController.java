package com.extracenter.backend.controller;

import java.time.LocalDate;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.extracenter.backend.dto.FinanceRecordRequest;
import com.extracenter.backend.dto.FinanceReportResponse;
import com.extracenter.backend.entity.CenterFinanceRecord;
import com.extracenter.backend.service.CenterFinanceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/centers/finance")
@CrossOrigin(originPatterns = "*")
public class CenterFinanceController {

    @Autowired
    private CenterFinanceService centerFinanceService;

    // POST: /api/centers/finance/records?centerId=...
    @PostMapping("/records")
    public ResponseEntity<?> createRecord(
            @RequestParam Long centerId,
            @Valid @RequestBody FinanceRecordRequest request) {
        try {
            // centerId is resolved/validated inside service (current manager center)
            // but we keep signature aligned to UI.
            CenterFinanceRecord created = centerFinanceService.createRecord(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT: /api/centers/finance/records/{recordId}
    @PutMapping("/records/{recordId}")
    public ResponseEntity<?> updateRecord(
            @PathVariable Long recordId,
            @Valid @RequestBody FinanceRecordRequest request) {
        try {
            CenterFinanceRecord updated = centerFinanceService.updateRecord(recordId, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE: /api/centers/finance/records/{recordId}?actorUserId=...
    @DeleteMapping("/records/{recordId}")
    public ResponseEntity<?> deleteRecord(
            @PathVariable Long recordId,
            @RequestParam Long actorUserId) {
        try {
            centerFinanceService.deleteRecord(recordId, actorUserId);
            return ResponseEntity.ok(Map.of("message", "Record deleted successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET: /api/centers/finance/records?centerId=...&start=yyyy-MM-dd&end=yyyy-MM-dd
    @GetMapping("/records")
    public ResponseEntity<?> listRecords(
            @RequestParam Long centerId,
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {
        try {
            List<CenterFinanceRecord> records = centerFinanceService.listRecordsForCenter(centerId, start, end);
            return ResponseEntity.ok(records);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET: /api/centers/finance/reports/monthly?centerId=...&date=yyyy-MM-dd
    @GetMapping("/reports/monthly")
    public ResponseEntity<?> monthlyReport(
            @RequestParam Long centerId,
            @RequestParam LocalDate date) {
        try {
            FinanceReportResponse report = centerFinanceService.monthlyReport(date, centerId);
            return ResponseEntity.ok(report);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET: /api/centers/finance/reports/yearly?centerId=...&year=2026
    @GetMapping("/reports/yearly")
    public ResponseEntity<?> yearlyReport(
            @RequestParam Long centerId,
            @RequestParam int year) {
        try {
            FinanceReportResponse report = centerFinanceService.yearlyReport(year, centerId);
            return ResponseEntity.ok(report);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

