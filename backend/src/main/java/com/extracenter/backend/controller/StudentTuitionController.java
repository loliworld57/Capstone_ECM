package com.extracenter.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.extracenter.backend.dto.StudentTuitionResponse;
import com.extracenter.backend.service.TuitionService;

@RestController
@RequestMapping("/api/tuition")
@CrossOrigin(originPatterns = "*")
public class StudentTuitionController {


    @Autowired
    private TuitionService tuitionService;

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

}

