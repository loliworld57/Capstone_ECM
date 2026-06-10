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
import org.springframework.web.bind.annotation.RestController;

import com.extracenter.backend.dto.FinanceRecordRequest;
import com.extracenter.backend.dto.FinanceReportResponse;
import com.extracenter.backend.entity.TeacherFinanceRecord;
import com.extracenter.backend.service.TeacherFinanceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/teacher/finance")
@CrossOrigin(originPatterns = "*")
public class TeacherFinanceController {

    @Autowired
    private TeacherFinanceService teacherFinanceService;

    // POST: /api/teacher/finance/records
    @PostMapping("/records")
    public ResponseEntity<?> createRecord(@Valid @RequestBody FinanceRecordRequest request) {
        try {
            TeacherFinanceRecord created = teacherFinanceService.createRecord(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT: /api/teacher/finance/records/{recordId}
    @PutMapping("/records/{recordId}")
    public ResponseEntity<?> updateRecord(
            @PathVariable Long recordId,
            @Valid @RequestBody FinanceRecordRequest request) {
        try {
            TeacherFinanceRecord updated = teacherFinanceService.updateRecord(recordId, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE: /api/teacher/finance/records/{recordId}
    @DeleteMapping("/records/{recordId}")
    public ResponseEntity<?> deleteRecord(@PathVariable Long recordId) {
        try {
            teacherFinanceService.deleteRecord(recordId);
            return ResponseEntity.ok(Map.of("message", "Record deleted successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET: /api/teacher/finance/records?start=yyyy-MM-dd&end=yyyy-MM-dd
    @GetMapping("/records")
    public ResponseEntity<?> listRecords(
            @org.springframework.web.bind.annotation.RequestParam LocalDate start,
            @org.springframework.web.bind.annotation.RequestParam LocalDate end) {

        try {
            List<TeacherFinanceRecord> records = teacherFinanceService.listRecords(start, end);
            return ResponseEntity.ok(records);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET: /api/teacher/finance/reports/monthly?date=yyyy-MM-dd
    @GetMapping("/reports/monthly")
    public ResponseEntity<?> monthlyReport(
            @org.springframework.web.bind.annotation.RequestParam LocalDate date) {
        try {
            FinanceReportResponse report = teacherFinanceService.monthlyReport(date);
            return ResponseEntity.ok(report);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET: /api/teacher/finance/reports/yearly?year=2026
    @GetMapping("/reports/yearly")
    public ResponseEntity<?> yearlyReport(
            @org.springframework.web.bind.annotation.RequestParam int year) {
        try {
            FinanceReportResponse report = teacherFinanceService.yearlyReport(year);
            return ResponseEntity.ok(report);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

