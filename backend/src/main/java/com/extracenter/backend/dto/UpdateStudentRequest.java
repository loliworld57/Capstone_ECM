package com.extracenter.backend.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateStudentRequest {
    @NotBlank(message = "First name is required")
    @Pattern(regexp = "^[\\p{L}\\s'-]+$", message = "First name cannot contain numbers")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Pattern(regexp = "^[\\p{L}\\s'-]+$", message = "Last name cannot contain numbers")
    private String lastName;

    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\d{10}$", message = "Phone number must be exactly 10 digits")
    private String phoneNumber;

    @NotNull(message = "Date of birth is required")
    @PastOrPresent(message = "Date of birth cannot be in the future")
    private LocalDate dateOfBirth;
}
