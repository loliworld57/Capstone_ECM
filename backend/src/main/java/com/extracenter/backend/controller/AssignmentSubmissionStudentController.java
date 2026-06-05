package com.extracenter.backend.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.extracenter.backend.dto.AssignmentSubmissionResponse;
import com.extracenter.backend.entity.AssignmentSubmission;
import com.extracenter.backend.service.AssignmentService;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentSubmissionStudentController {

    @Autowired
    private AssignmentService assignmentService;

    @GetMapping("/{assignmentId}/submissions/student/{studentId}")
    public ResponseEntity<?> getStudentSubmission(
            @PathVariable Long assignmentId,
            @PathVariable Long studentId) {
        try {
            AssignmentSubmissionResponse resp = assignmentService.getStudentSubmissionDto(assignmentId, studentId);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

