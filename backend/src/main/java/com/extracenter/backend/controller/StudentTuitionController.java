package com.extracenter.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.extracenter.backend.dto.StudentTuitionResponse;
import com.extracenter.backend.dto.TuitionAccountRequest;
import com.extracenter.backend.service.TuitionService;
import com.extracenter.backend.service.TuitionAccountService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tuition")
@CrossOrigin(originPatterns = "*")
public class StudentTuitionController {


    @Autowired
    private TuitionService tuitionService;

    @Autowired
    private TuitionAccountService tuitionAccountService;

    // GET: /api/tuition/student/me
    @GetMapping("/student/me")
    public ResponseEntity<?> getMyTuition() {
        try {
            List<StudentTuitionResponse> response = tuitionService.getTuitionForCurrentStudent();
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET: /api/tuition/student/{studentId}
    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getTuition(@PathVariable Long studentId) {
        try {
            List<StudentTuitionResponse> response = tuitionService.getTuitionForStudent(studentId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST: /api/tuition/accounts
    @PostMapping("/accounts")
    public ResponseEntity<?> createOrUpdateTuitionAccount(@Valid @RequestBody TuitionAccountRequest request) {
        try {
            return ResponseEntity.ok(tuitionAccountService.createOrUpdateAccount(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

}

