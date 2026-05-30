package com.extracenter.backend.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${app.email.from:onboarding@resend.dev}")
    private String senderEmail;

    @Value("${resend.api.key}")
    private String resendApiKey;

    // @Async is CRITICAL: It sends the email in the background so the user
    // doesn't have to wait 3-5 seconds on the loading screen for the SMTP server.
    @Async
    public void sendVerificationEmail(String toEmail, String otp) {
        logger.info("Email Request Received -> sendVerificationEmail to={}", toEmail);
        logger.info("OTP Code Generated -> {}", otp);
        try {
            String content = "Hello,\n\n" +
                    "Thank you for registering with the ECM System.\n" +
                    "Your verification code (OTP) is:\n\n" +
                    "    " + otp + "\n\n" +
                    "This code will expire in 10 minutes. Please do not share this code with anyone.\n\n" +
                    "Best regards,\n" +
                    "The ECM Team";

            logger.info("Sending to user email -> {}", toEmail);
            sendResendEmail(toEmail, "[ECM] Account Verification Code", content);

            logger.info("Verification email SUCCESS -> sent to={}", toEmail);
        } catch (Exception e) {
            logger.error("Verification email FAILED -> to={}", toEmail, e);
        }
    }

    // Send email with credentials (Step 2)
    @Async
    public void sendCredentialEmail(String toEmail, String newAccountEmail, String password) {
        logger.info("Email Request Received -> sendCredentialEmail to={}", toEmail);
        try {
            String content = "Welcome to ECM,\n\n" +
                    "Your account has been successfully created.\n" +
                    "---------------------------------\n" +
                    "Login Email: " + newAccountEmail + "\n" +
                    "Password: " + password + "\n" +
                    "---------------------------------\n\n" +
                    "Please log in and change your password immediately to secure your account.\n\n" +
                    "Best regards,\n" +
                    "The ECM Team";

            logger.info("Sending credential email -> to={}", toEmail);
            sendResendEmail(toEmail, "[ECM] Registration Successful - Login Credentials", content);

            logger.info("Credential email SUCCESS -> sent to={}", toEmail);
        } catch (Exception e) {
            logger.error("Credential email FAILED -> to={}", toEmail, e);
        }
    }

    @Async
    public void sendCourseDeleteOtpEmail(String toEmail, String courseName, String otp) {
        logger.info("Email Request Received -> sendCourseDeleteOtpEmail to={}", toEmail);
        logger.info("OTP Code Generated -> {} for course={}", otp, courseName);
        try {
            String content = "Hello,\n\n" +
                    "You requested to delete course: \"" + courseName + "\".\n" +
                    "Please use this OTP to confirm deletion:\n\n" +
                    "    " + otp + "\n\n" +
                    "This OTP will expire in 10 minutes.\n" +
                    "If you did not request this action, please ignore this email.\n\n" +
                    "Best regards,\n" +
                    "The ECM Team";

            logger.info("Sending course deletion OTP email -> to={}", toEmail);
            sendResendEmail(toEmail, "[ECM] Confirm Course Deletion OTP", content);

            logger.info("Course deletion OTP email SUCCESS -> sent to={}", toEmail);
        } catch (Exception e) {
            logger.error("Course deletion OTP email FAILED -> to={}", toEmail, e);
        }
    }

    private void sendResendEmail(String toEmail, String subject, String body) throws IOException, InterruptedException {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            throw new IllegalStateException("Resend API key is not configured. Set RESEND_API_KEY.");
        }

        String payload = "{"
                + "\"from\":\"" + escapeJson(senderEmail) + "\","
                + "\"to\":[\"" + escapeJson(toEmail) + "\"],"
                + "\"subject\":\"" + escapeJson(subject) + "\","
                + "\"text\":\"" + escapeJson(body) + "\""
                + "}";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.resend.com/emails"))
                .timeout(Duration.ofSeconds(10))
                .header("Authorization", "Bearer " + resendApiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = HTTP_CLIENT.send(request,
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

        if (response.statusCode() >= 300) {
            throw new IOException("Resend API returned status " + response.statusCode() + ": " + response.body());
        }
    }

    private String escapeJson(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
