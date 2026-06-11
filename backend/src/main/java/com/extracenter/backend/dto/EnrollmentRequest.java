package com.extracenter.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EnrollmentRequest {

    @NotBlank(message = "Student email is required")
    @Email(message = "Please provide a valid email address")
    private String studentEmail;

    @NotNull(message = "Course ID is required")
    private Long courseId;

    private String note;

    private TuitionAccountRequest tuitionAccount;
}
