package com.extracenter.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    // @Async is CRITICAL: It sends the email in the background so the user
    // doesn't have to wait 3-5 seconds on the loading screen for the SMTP server.
    @Async
    public void sendVerificationEmail(String toEmail, String otp) {
        logger.info("Email Request Received -> sendVerificationEmail to={}", toEmail);
        logger.info("OTP Code Generated -> {}", otp);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail); // Always set 'From' to prevent spam folder issues
            message.setTo(toEmail);
            message.setSubject("[ECM] Account Verification Code");

            // Professional English content
            String content = "Hello,\n\n" +
                    "Thank you for registering with the ECM System.\n" +
                    "Your verification code (OTP) is:\n\n" +
                    "    " + otp + "\n\n" +
                    "This code will expire in 10 minutes. Please do not share this code with anyone.\n\n" +
                    "Best regards,\n" +
                    "The ECM Team";

            message.setText(content);
            logger.info("Sending to user email -> {}", toEmail);
            mailSender.send(message);

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
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(toEmail);
            message.setSubject("[ECM] Registration Successful - Login Credentials");

            String content = "Welcome to ECM,\n\n" +
                    "Your account has been successfully created.\n" +
                    "---------------------------------\n" +
                    "Login Email: " + newAccountEmail + "\n" +
                    "Password: " + password + "\n" +
                    "---------------------------------\n\n" +
                    "Please log in and change your password immediately to secure your account.\n\n" +
                    "Best regards,\n" +
                    "The ECM Team";

            message.setText(content);
            logger.info("Sending credential email -> to={}", toEmail);
            mailSender.send(message);

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
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(toEmail);
            message.setSubject("[ECM] Confirm Course Deletion OTP");

            String content = "Hello,\n\n" +
                    "You requested to delete course: \"" + courseName + "\".\n" +
                    "Please use this OTP to confirm deletion:\n\n" +
                    "    " + otp + "\n\n" +
                    "This OTP will expire in 10 minutes.\n" +
                    "If you did not request this action, please ignore this email.\n\n" +
                    "Best regards,\n" +
                    "The ECM Team";

            message.setText(content);
            logger.info("Sending course deletion OTP email -> to={}", toEmail);
            mailSender.send(message);

            logger.info("Course deletion OTP email SUCCESS -> sent to={}", toEmail);
        } catch (Exception e) {
            logger.error("Course deletion OTP email FAILED -> to={}", toEmail, e);
        }
    }
}