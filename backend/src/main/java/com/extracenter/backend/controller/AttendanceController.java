package com.extracenter.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.extracenter.backend.dto.AttendanceRequest;
import com.extracenter.backend.dto.AttendanceSheetResponse;
import com.extracenter.backend.dto.StudentAttendanceRecordDTO;
import com.extracenter.backend.entity.Attendance;
import com.extracenter.backend.service.AttendanceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/attendance")
// Optional but highly recommended: Allow your React frontend (e.g.,
// localhost:3000) to talk to this API
@CrossOrigin(originPatterns = "*")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    // API 1: Mark or Save Attendance (POST)
    // URL: http://localhost:8080/api/attendance
    // ADDED @Valid: This tells Spring to trigger the @NotNull and @NotEmpty rules
    // we put in AttendanceRequest!
    @PostMapping
    public ResponseEntity<?> markAttendance(@Valid @RequestBody AttendanceRequest request) {
        try {
            String result = attendanceService.markAttendance(request);
            // BEST PRACTICE: Returning a JSON object (Map) instead of a raw String.
            // In React, this is easily readable as: response.data.message
            return ResponseEntity.ok(Map.of("message", result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // API 2: View the attendance list for a specific lesson day (GET)
    // ARCHITECTURE UPDATE: Replaced slotId and date with just classSessionId!
    // URL: http://localhost:8080/api/attendance?classSessionId=1
    @GetMapping
    public ResponseEntity<List<Attendance>> viewAttendance(@RequestParam Long classSessionId) {
        return ResponseEntity.ok(attendanceService.getAttendanceList(classSessionId));
    }

    @GetMapping("/sheet")
    public ResponseEntity<AttendanceSheetResponse> getAttendanceSheet(@RequestParam Long classSessionId) {
        return ResponseEntity.ok(attendanceService.getAttendanceSheet(classSessionId));
    }

    @GetMapping("/course/{courseId}/student/{studentId}")
    @PreAuthorize("hasAnyAuthority('STUDENT', 'TEACHER', 'MANAGER')")
    public ResponseEntity<List<StudentAttendanceRecordDTO>> getStudentAttendanceLogs(
            @PathVariable Long courseId,
            @PathVariable Long studentId) {

        System.out.println("Fetching attendance logs for student ID: " + studentId);

        List<StudentAttendanceRecordDTO> logHistory = attendanceService.getStudentAttendanceLog(courseId, studentId);
        return ResponseEntity.ok(logHistory);
    }
}