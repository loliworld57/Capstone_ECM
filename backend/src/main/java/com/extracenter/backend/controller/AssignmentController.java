package com.extracenter.backend.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.extracenter.backend.dto.ScoreRequest;
import com.extracenter.backend.entity.Assignment;
import com.extracenter.backend.entity.AssignmentSubmission;
import com.extracenter.backend.service.AssignmentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    @Autowired
    private AssignmentService assignmentService;

    // --- 1. API CHO GIÁO VIÊN TẠO BÀI TẬP ---
    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<?> createAssignment(
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("dueDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dueDate,
            @RequestParam("courseId") Long courseId,
            @RequestParam(value = "classSessionId", required = false) Long classSessionId,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            Assignment assignment = assignmentService.createAssignment(title, description, dueDate, courseId,
                    classSessionId, file);
            return ResponseEntity.status(HttpStatus.CREATED).body(assignment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // --- 2. LẤY CHI TIẾT 1 BÀI TẬP ---
    @GetMapping("/{assignmentId}")
    public ResponseEntity<Assignment> getAssignmentDetail(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(assignmentService.getAssignmentById(assignmentId));
    }

    // --- 3. LẤY DANH SÁCH BÀI TẬP CỦA KHÓA HỌC ---
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Assignment>> getAssignmentsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsForCourse(courseId));
    }


    // --- 3. API CHO HỌC SINH NỘP BÀI LÀM ---
    @PostMapping(value = "/{assignmentId}/submit", consumes = { "multipart/form-data" })
    public ResponseEntity<?> submitAssignment(
            @PathVariable Long assignmentId,
            @RequestParam("studentId") Long studentId,
            @RequestParam("file") MultipartFile file) {
        try {
            AssignmentSubmission submission = assignmentService.submitAssignment(assignmentId, studentId, file);
            return ResponseEntity.ok(submission);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // --- 4. API LẤY DANH SÁCH BÀI NỘP CHO GIÁO VIÊN ---
    @GetMapping("/{assignmentId}/submissions")
    public ResponseEntity<List<AssignmentSubmission>> getSubmissions(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(assignmentService.getSubmissionsByAssignment(assignmentId));
    }

    // --- 5. API CHẤM ĐIỂM BÀI NỘP ---
    @PutMapping("/submissions/{submissionId}/grade")
    public ResponseEntity<?> gradeSubmission(
            @PathVariable Long submissionId,
            @Valid @RequestBody ScoreRequest request) {
        try {
            AssignmentSubmission graded = assignmentService.gradeSubmission(submissionId, request);
            return ResponseEntity.ok(graded);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping(value = "/{id}", consumes = { "multipart/form-data" })
    public ResponseEntity<?> updateAssignment(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("dueDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dueDate,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            // Logic Update (Cần tự thêm hàm này vào AssignmentService nhé)
            Assignment updated = assignmentService.updateAssignment(id, title, description, dueDate, file);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // --- XÓA BÀI TẬP (DELETE) ---
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAssignment(@PathVariable Long id) {
        try {
            assignmentService.deleteAssignment(id);
            return ResponseEntity.ok("Deleted successfully");
        } catch (Exception e) {
            // Surface the real error message in a consistent way
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage(), "type", e.getClass().getSimpleName()));
        }
    }


    @GetMapping("/student/{studentId}/pending")
    public ResponseEntity<List<Assignment>> getPendingAssignments(@PathVariable Long studentId) {
        return ResponseEntity.ok(assignmentService.getPendingAssignments(studentId));
    }
}