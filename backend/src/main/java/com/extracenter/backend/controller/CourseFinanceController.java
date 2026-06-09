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
import com.extracenter.backend.entity.CourseFinanceRecord;
import com.extracenter.backend.service.CourseFinanceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/courses/finance")
@CrossOrigin(originPatterns = "*")
public class CourseFinanceController {

    @Autowired
    private CourseFinanceService courseFinanceService;

    // POST: /api/courses/finance/records?courseId=...
    @PostMapping("/records")
    public ResponseEntity<?> createRecord(
            @RequestParam Long courseId,
            @Valid @RequestBody FinanceRecordRequest request) {
        try {
            CourseFinanceRecord created = courseFinanceService.createRecord(courseId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT: /api/courses/finance/records/{recordId}
    @PutMapping("/records/{recordId}")
    public ResponseEntity<?> updateRecord(
            @PathVariable Long recordId,
            @Valid @RequestBody FinanceRecordRequest request) {
        try {
            CourseFinanceRecord updated = courseFinanceService.updateRecord(recordId, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE: /api/courses/finance/records/{recordId}?actorUserId=...
    @DeleteMapping("/records/{recordId}")
    public ResponseEntity<?> deleteRecord(
            @PathVariable Long recordId,
            @RequestParam Long actorUserId) {
        try {
            courseFinanceService.deleteRecord(recordId, actorUserId);
            return ResponseEntity.ok(Map.of("message", "Record deleted successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET: /api/courses/finance/records?courseId=...&start=yyyy-MM-dd&end=yyyy-MM-dd
    @GetMapping("/records")
    public ResponseEntity<?> listRecords(
            @RequestParam Long courseId,
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {
        try {
            List<CourseFinanceRecord> records = courseFinanceService.listRecords(courseId, start, end);
            return ResponseEntity.ok(records);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET: /api/courses/finance/reports/monthly?courseId=...&date=yyyy-MM-dd
    @GetMapping("/reports/monthly")
    public ResponseEntity<?> monthlyReport(
            @RequestParam Long courseId,
            @RequestParam LocalDate date) {
        try {
            FinanceReportResponse report = courseFinanceService.monthlyReport(courseId, date);
            return ResponseEntity.ok(report);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET: /api/courses/finance/reports/profit?courseId=...&date=yyyy-MM-dd
    @GetMapping("/reports/profit")
    public ResponseEntity<?> profitReport(
            @RequestParam Long courseId,
            @RequestParam LocalDate date) {
        try {
            FinanceReportResponse report = courseFinanceService.profitReport(courseId, date);
            return ResponseEntity.ok(report);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

