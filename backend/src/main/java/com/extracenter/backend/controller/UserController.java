package com.extracenter.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.extracenter.backend.dto.ChangePasswordRequest;
import com.extracenter.backend.dto.CreateStudentRequest;
import com.extracenter.backend.dto.LoginRequest;
import com.extracenter.backend.dto.LoginResponse;
import com.extracenter.backend.dto.RegisterRequest;
import com.extracenter.backend.dto.TeacherStudentResponse;
import com.extracenter.backend.dto.UpdateProfileRequest;
import com.extracenter.backend.dto.UserProfileResponse;
import com.extracenter.backend.dto.UserStatsResponse;
import com.extracenter.backend.dto.VerifyOtpRequest;
import com.extracenter.backend.entity.User;
import com.extracenter.backend.repository.UserRepository;
import com.extracenter.backend.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    // 1. API: Đăng ký Giáo viên (Bước 1 - Gửi mail)
    // POST: http://localhost:8080/api/users/register-teacher
    @PostMapping("/register-teacher")
    public ResponseEntity<?> registerTeacher(@Valid @RequestBody RegisterRequest request) {
        try {
            String result = userService.registerTeacher(request);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Invalid request.");
        return ResponseEntity.badRequest().body(message);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
        try {
            String result = userService.verifyAccount(request.getEmail(), request.getOtp());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Đăng nhập
    // POST: http://192.168.0.100:8080/api/users/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = userService.loginUser(request);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            if (e.getMessage().equals("Invalid email or password!")) {
                return ResponseEntity.status(401).body(e.getMessage());
            }

            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    // API: Update Profile
    // GET: /api/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getProfile(@PathVariable Long id) {
        try {
            UserProfileResponse profile = userService.getProfile(id);
            return ResponseEntity.ok(profile);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    // API: Update Profile
    // PUT: /api/users/{id}/profile
    @PutMapping("/{id}/profile")
    public ResponseEntity<?> updateProfile(@PathVariable Long id, @RequestBody UpdateProfileRequest request) {
        try {
            User updatedUser = userService.updateProfile(id, request);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            String message = e.getMessage();
            if ("You do not have permission to access this user.".equals(message)) {
                return ResponseEntity.status(403).body(message);
            }

            return ResponseEntity.badRequest().body(message);
        }
    }

    // API: Change Password
    // PUT: /api/users/{id}/change-password
    @PutMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @RequestBody ChangePasswordRequest request) {
        try {
            userService.changePassword(id, request);
            return ResponseEntity.ok("Password changed successfully!");
        } catch (RuntimeException e) {
            if ("You do not have permission to access this user.".equals(e.getMessage())) {
                return ResponseEntity.status(403).body(e.getMessage());
            }

            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Deactivate Account (Self)
    // POST: /api/users/{id}/deactivate
    @PostMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivateAccount(@PathVariable Long id) {
        try {
            userService.deactivateAccount(id);
            return ResponseEntity.ok("Account has been deactivated.");
        } catch (RuntimeException e) {
            if ("You do not have permission to access this user.".equals(e.getMessage())) {
                return ResponseEntity.status(403).body(e.getMessage());
            }

            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API Tìm kiếm học sinh
    // GET: /api/users/search?keyword=Nguyen Van
    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('TEACHER','ROLE_TEACHER','ADMIN','ROLE_ADMIN')")
    public ResponseEntity<List<User>> searchStudents(@RequestParam String keyword) {
        return ResponseEntity.ok(userRepository.searchStudents(keyword));
    }

    @GetMapping("/teacher/{teacherId}/students")
    @PreAuthorize("hasAnyAuthority('TEACHER','ROLE_TEACHER','ADMIN','ROLE_ADMIN')")
    public ResponseEntity<?> getTeacherStudents(
            @PathVariable Long teacherId,
            @RequestParam(defaultValue = "true") boolean active) {
        try {
            List<TeacherStudentResponse> students = userService.getTeacherVisibleStudents(teacherId, active);
            return ResponseEntity.ok(students);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API Tạo nhanh học sinh (Auto Email)
    // POST: /api/users/create-student
    @PostMapping("/create-student")
    @PreAuthorize("hasAnyAuthority('TEACHER','ROLE_TEACHER','ADMIN','ROLE_ADMIN')")
    public ResponseEntity<?> createStudentAuto(@Valid @RequestBody CreateStudentRequest request) {
        User newUser = userService.createStudentAutoEmail(request);
        return ResponseEntity.ok(newUser);
    }

    // API: Users cannot be deleted
    // DELETE: /api/users/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            String result = userService.deleteStudentPermanently(id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT: /api/users/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> updateStudent(@PathVariable Long id, @Valid @RequestBody CreateStudentRequest request) {
        try {
            User updated = userService.updateStudent(id, request);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/teacher/{teacherId}/students/{studentId}")
    @PreAuthorize("hasAnyAuthority('TEACHER','ROLE_TEACHER','ADMIN','ROLE_ADMIN')")
    public ResponseEntity<?> updateTeacherStudent(
            @PathVariable Long teacherId,
            @PathVariable Long studentId,
            @Valid @RequestBody CreateStudentRequest request) {
        try {
            User updated = userService.updateTeacherManagedStudent(teacherId, studentId, request);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/teacher/{teacherId}/students/{studentId}")
    @PreAuthorize("hasAnyAuthority('TEACHER','ROLE_TEACHER','ADMIN','ROLE_ADMIN')")
    public ResponseEntity<?> removeTeacherStudent(
            @PathVariable Long teacherId,
            @PathVariable Long studentId) {
        try {
            String result = userService.removeTeacherManagedStudent(teacherId, studentId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/teacher/{teacherId}/students/{studentId}/rollback")
    @PreAuthorize("hasAnyAuthority('TEACHER','ROLE_TEACHER','ADMIN','ROLE_ADMIN')")
    public ResponseEntity<?> rollbackTeacherStudent(
            @PathVariable Long teacherId,
            @PathVariable Long studentId) {
        try {
            String result = userService.rollbackTeacherManagedStudent(teacherId, studentId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/teacher/{teacherId}/students/{studentId}/permanent")
    @PreAuthorize("hasAnyAuthority('TEACHER','ROLE_TEACHER','ADMIN','ROLE_ADMIN')")
    public ResponseEntity<?> permanentlyDeleteTeacherStudent(
            @PathVariable Long teacherId,
            @PathVariable Long studentId) {
        try {
            String result = userService.permanentlyDeleteTeacherManagedStudent(teacherId, studentId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/teacher/{teacherId}/students/{studentId}/reset-password")
    @PreAuthorize("hasAnyAuthority('TEACHER','ROLE_TEACHER','ADMIN','ROLE_ADMIN')")
    public ResponseEntity<?> resetTeacherStudentPassword(
            @PathVariable Long teacherId,
            @PathVariable Long studentId) {
        try {
            String result = userService.resetStudentPasswordByTeacher(teacherId, studentId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Resend OTP
    // POST: /api/users/resend-otp?email=abc@gmail.com
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestParam String email) {
        try {
            String result = userService.resendOtp(email);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API: Admin khóa/mở khóa User
    // PUT: /api/users/admin/lock?adminId=1&targetUserId=5
    @PutMapping("/admin/lock")
    @PreAuthorize("hasAnyAuthority('ADMIN','ROLE_ADMIN')")
    public ResponseEntity<?> toggleLock(@RequestParam Long adminId, @RequestParam Long targetUserId) {
        try {
            String result = userService.toggleUserLock(adminId, targetUserId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    // API: Admin xem thống kê của User
    // GET: /api/users/admin/stats?adminId=1&targetUserId=5
    @GetMapping("/admin/stats")
    public ResponseEntity<?> getUserStats(@RequestParam Long adminId, @RequestParam Long targetUserId) {
        try {
            UserStatsResponse stats = userService.getUserStats(adminId, targetUserId);
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    // API: Get All Users (For Admin Dashboard)
    // GET: /api/users/admin/all
    @GetMapping("/admin/all")
    @PreAuthorize("hasAnyAuthority('ADMIN','ROLE_ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        // In a real app, use Pagination (Pageable) here!
        return ResponseEntity.ok(userRepository.findAll());
    }

}
