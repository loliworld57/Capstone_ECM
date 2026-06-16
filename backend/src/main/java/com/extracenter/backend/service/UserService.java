package com.extracenter.backend.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.dto.ChangePasswordRequest;
import com.extracenter.backend.dto.CreateStudentRequest;
import com.extracenter.backend.dto.LoginRequest;
import com.extracenter.backend.dto.LoginResponse;
import com.extracenter.backend.dto.RegisterRequest;
import com.extracenter.backend.dto.TeacherStudentResponse;
import com.extracenter.backend.dto.UpdateProfileRequest;
import com.extracenter.backend.dto.UpdateStudentRequest;
import com.extracenter.backend.dto.UserProfileResponse;
import com.extracenter.backend.dto.UserStatsResponse;
import com.extracenter.backend.entity.Center;
import com.extracenter.backend.entity.Role;
import com.extracenter.backend.entity.User;
import com.extracenter.backend.entity.VerificationToken;
import com.extracenter.backend.repository.CenterRepository;
import com.extracenter.backend.repository.CourseRepository;
import com.extracenter.backend.repository.EnrollmentRepository;
import com.extracenter.backend.repository.RoleRepository;
import com.extracenter.backend.repository.UserRepository;
import com.extracenter.backend.repository.VerificationTokenRepository;
import com.extracenter.backend.utils.EmailUtils;
import com.extracenter.backend.utils.JwtUtils;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private VerificationTokenRepository tokenRepository;
    @Autowired
    private EmailService emailService;
    @Autowired
    private CenterRepository centerRepository;
    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private EnrollmentRepository enrollmentRepository;
    @Autowired
    private JwtUtils jwtUtils;

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long id) {
        User user = getAccessibleUser(id);
        return UserProfileResponse.from(user);
    }

    /**
     * Authenticates a user and returns a token with filtered user info.
     */
    public LoginResponse loginUser(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password!"));

        // SECURITY WARNING: In a production app, use BCryptPasswordEncoder here!
        if (!user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Invalid email or password!");
        }

        if (user.isLocked()) {
            throw new RuntimeException("Your account is locked. Please contact admin@ecm.edu.vn.");
        }

        if (!user.isEnabled()) {
            handleResendingOtp(user);
            throw new RuntimeException("ACCOUNT_DEACTIVATED");
        }

        String token = jwtUtils.generateToken(user);

        // 1. Map Entity collection to a List of IDs using Java Streams
        List<Long> centerIds = user.getConnectedCenters().stream()
                .map(Center::getId)
                .collect(Collectors.toList());

        // 2. Map Entity to DTO to avoid leaking sensitive data (like password) to the
        // frontend
        LoginResponse.UserInfo userInfo = new LoginResponse.UserInfo(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole().getName(),
                centerIds // Passing the newly created list of IDs!
        );

        return new LoginResponse(token, userInfo);
    }

    /**
     * Private helper to handle OTP logic during login attempts for disabled
     * accounts.
     */
    private void handleResendingOtp(User user) {
        VerificationToken existingToken = tokenRepository.findByUser(user).orElse(null);

        if (existingToken != null && existingToken.getExpiryDate().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("PENDING_VERIFICATION");
        }

        if (existingToken != null) {
            tokenRepository.delete(existingToken);
        }

        String otp = generateOTP();
        VerificationToken newToken = new VerificationToken(user, otp);
        tokenRepository.save(newToken);

        emailService.sendVerificationEmail(user.getPersonalEmail(), otp);
    }

    public User updateProfile(Long id, UpdateProfileRequest request) {
        User user = getAccessibleUser(id);

        // Validate firstName and lastName
        if (request.getFirstName() == null || request.getFirstName().trim().isEmpty()) {
            throw new RuntimeException("First name cannot be empty!");
        }
        if (request.getLastName() == null || request.getLastName().trim().isEmpty()) {
            throw new RuntimeException("Last name cannot be empty!");
        }

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setDateOfBirth(request.getDateOfBirth());

        return userRepository.save(user);
    }

    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = getAccessibleUser(userId);

        if (!user.getPassword().equals(request.getOldPassword())) {
            throw new RuntimeException("Incorrect old password!");
        }
        user.setPassword(request.getNewPassword());
        userRepository.save(user);
    }

    public String toggleUserLock(Long adminId, Long targetUserId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found!"));
        if (!"ADMIN".equals(admin.getRole().getName())) {
            throw new RuntimeException("You do not have permission to perform this action!");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found!"));

        boolean newStatus = !targetUser.isLocked();
        targetUser.setLocked(newStatus);
        userRepository.save(targetUser);

        return newStatus ? "Account has been locked." : "Account has been unlocked.";
    }

    public UserStatsResponse getUserStats(Long adminId, Long targetUserId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found!"));

        if (!"ADMIN".equals(admin.getRole().getName())) {
            throw new RuntimeException("Unauthorized");
        }

        long centers = userRepository.countCentersByUserId(targetUserId);
        long courses = courseRepository.countByTeacherId(targetUserId);
        long students = courseRepository.countStudentsByTeacherId(targetUserId);

        return UserStatsResponse.builder()
                .userId(targetUserId)
                .totalCenters(centers)
                .totalCourses(courses)
                .totalStudents(students)
                .totalTeachers(userRepository.countByRoleName("TEACHER"))
                .build();
    }

    @Transactional
    public User updateStudent(Long id, CreateStudentRequest request) {
        User student = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found!"));

        student.setFirstName(request.getFirstName());
        student.setLastName(request.getLastName());
        student.setPhoneNumber(request.getPhoneNumber());
        student.setDateOfBirth(request.getDateOfBirth());

        return userRepository.save(student);
    }

    @Transactional(readOnly = true)
    public List<TeacherStudentResponse> getTeacherVisibleStudents(Long teacherId, boolean activeOnly) {
        User teacher = getAuthorizedTeacherActor(teacherId);

        if (!activeOnly) {
            return userRepository.findRolledOutStudentsByCreatorTeacherId(teacherId).stream()
                    .sorted(Comparator.comparing(User::getLastName, String.CASE_INSENSITIVE_ORDER)
                            .thenComparing(User::getFirstName, String.CASE_INSENSITIVE_ORDER))
                    .map(student -> toTeacherStudentResponse(student, teacherId))
                    .collect(Collectors.toList());
        }

        Map<Long, User> visibleStudents = new LinkedHashMap<>();

        userRepository.findActiveStudentsByCreatorTeacherId(teacherId)
            .forEach(student -> visibleStudents.put(student.getId(), student));

        enrollmentRepository.findActiveStudentsByTeacherId(teacher.getId())
            .forEach(student -> visibleStudents.put(student.getId(), student));

        return visibleStudents.values().stream()
                .sorted(Comparator.comparing(User::getLastName, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(User::getFirstName, String.CASE_INSENSITIVE_ORDER))
                .map(student -> toTeacherStudentResponse(student, teacherId))
                .collect(Collectors.toList());
    }

    @Transactional
    public User updateTeacherManagedStudent(Long teacherId, Long studentId, UpdateStudentRequest request) {
        User student = getActiveOwnedStudent(teacherId, studentId);

        student.setFirstName(request.getFirstName());
        student.setLastName(request.getLastName());
        student.setPhoneNumber(request.getPhoneNumber());
        student.setDateOfBirth(request.getDateOfBirth());

        return userRepository.save(student);
    }

    @Transactional
    public String removeTeacherManagedStudent(Long teacherId, Long studentId) {
        User student = getOwnedStudent(teacherId, studentId);

        if (!student.isEnabled()) {
            return "Student is already rolled out.";
        }

        return rollOutStudent(student);
    }

    @Transactional
    public String rollbackTeacherManagedStudent(Long teacherId, Long studentId) {
        User student = getOwnedStudent(teacherId, studentId);

        if (student.isEnabled()) {
            throw new RuntimeException("Only rolled out students can be restored.");
        }

        student.setEnabled(true);
        userRepository.save(student);
        return "Student restored successfully.";
    }

    @Transactional
    public String permanentlyDeleteTeacherManagedStudent(Long teacherId, Long studentId) {
        return removeTeacherManagedStudent(teacherId, studentId);
    }

    @Transactional
    public String resetStudentPasswordByTeacher(Long teacherId, Long studentId) {
        User student = getActiveOwnedStudent(teacherId, studentId);
        student.setPassword("ecm123");
        userRepository.save(student);
        return "Student password has been reset to ecm123.";
    }

    // 2. Deactivate an Account (e.g., Soft delete or suspending a user)
    @Transactional
    public User deactivateAccount(Long id) {
        User user = getAccessibleUser(id);

        user.setEnabled(false); // Locks the user out of logging in
        return userRepository.save(user);
    }

    // 3. Resend OTP to the user's personal email
    @Transactional
    public String resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found!"));

        if (user.isEnabled()) {
            throw new RuntimeException("This account is already activated!");
        }

        // Find existing token or create a new one safely
        VerificationToken token = tokenRepository.findByUser(user).orElse(null);
        String newOtp = generateOTP();

        if (token == null) {
            token = new VerificationToken(user, newOtp);
        } else {
            token.setToken(newOtp);
            token.setExpiryDate(java.time.LocalDateTime.now().plusMinutes(10)); // Reset timer
        }

        tokenRepository.save(token);
        emailService.sendVerificationEmail(user.getPersonalEmail(), newOtp);

        return "A new OTP has been sent to your email.";
    }

    @Transactional
    public User createStudentAutoEmail(CreateStudentRequest request) {
        String finalEmail = generateUniqueEcmEmail(request.getFirstName(), request.getLastName());

        if (request.getCreatedByTeacherId() == null) {
            throw new RuntimeException("Creating teacher is required.");
        }

        User teacher = getAuthorizedTeacherActor(request.getCreatedByTeacherId());

        Center center = centerRepository.findById(request.getCenterId())
                .orElseThrow(() -> new RuntimeException("Center not found!"));

        User newUser = new User();
        newUser.setFirstName(request.getFirstName());
        newUser.setLastName(request.getLastName());
        newUser.setEmail(finalEmail);
        newUser.setPersonalEmail(finalEmail);
        newUser.setPhoneNumber(request.getPhoneNumber());
        newUser.setDateOfBirth(request.getDateOfBirth());
        newUser.setPassword("ecm123");
        newUser.setEnabled(true);
        newUser.setCreatedByTeacher(teacher);
        newUser.getConnectedCenters().add(center);

        Role studentRole = roleRepository.findByName("STUDENT")
                .orElseThrow(() -> new RuntimeException("Student role not found!"));
        newUser.setRole(studentRole);

        return userRepository.save(newUser);
    }

    @Transactional
    public void connectStudentToCenter(Long studentId, Long centerId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found!"));

        if (!student.isEnabled()) {
            throw new RuntimeException("Rolled out students cannot be linked to any center.");
        }

        Center center = centerRepository.findById(centerId)
                .orElseThrow(() -> new RuntimeException("Center not found!"));

        // FIX: Use the Set<Center> connectedCenters
        student.getConnectedCenters().add(center);
        userRepository.save(student);
    }

    @Transactional
    public void removeStudentFromCenter(Long studentId, Long centerId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found!"));
        Center center = centerRepository.findById(centerId)
                .orElseThrow(() -> new RuntimeException("Center not found!"));

        // Safely remove the center from the student's Many-To-Many set
        student.getConnectedCenters().remove(center);

        // Save the student to update the join table (student_centers)
        userRepository.save(student);
    }

    @Transactional
    public String registerTeacher(RegisterRequest request) {
        Optional<User> existingUserOpt = userRepository.findByEmail(request.getPersonalEmail());

        if (existingUserOpt.isEmpty()) {
            existingUserOpt = userRepository.findByPersonalEmail(request.getPersonalEmail());
        }

        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            VerificationToken waitingVerifyToken = tokenRepository.findByUser(existingUser).orElse(null);

            if (waitingVerifyToken != null) {
                throw new RuntimeException("PENDING_VERIFICATION");
            }
            if (existingUser.isEnabled()) {
                throw new RuntimeException("This email is already registered and active!");
            } else {
                throw new RuntimeException("This email is registered but deactivated.");
            }
        }

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPersonalEmail(request.getPersonalEmail());
        user.setEmail(request.getPersonalEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPassword(java.util.UUID.randomUUID().toString());
        user.setEnabled(false);
        user.setCreatedDate(LocalDateTime.now());

        Role teacherRole = roleRepository.findByName("TEACHER")
                .orElseThrow(() -> new RuntimeException("Teacher role not found!"));
        user.setRole(teacherRole);

        userRepository.save(user);

        String otp = generateOTP();
        VerificationToken token = new VerificationToken(user, otp);
        tokenRepository.save(token);

        emailService.sendVerificationEmail(user.getPersonalEmail(), otp);

        return "Verification email sent.";
    }

    @Transactional
    public String verifyAccount(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found!"));

        if (user.isEnabled()) {
            return "This account is already activated!";
        }

        VerificationToken vt = tokenRepository.findByUser(user).orElse(null);

        if (vt == null || !vt.getToken().equals(otp) || vt.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Invalid or expired OTP!");
        }

        if (!user.getEmail().equals(user.getPersonalEmail())) {
            user.setEnabled(true);
            userRepository.save(user);
            tokenRepository.delete(vt);
            return "Account reactivated.";
        } else {
            String finalEmail = generateUniqueEcmEmail(user.getFirstName(), user.getLastName());
            user.setEmail(finalEmail);
            user.setPassword("ecm123");
            user.setEnabled(true);

            userRepository.save(user);
            tokenRepository.delete(vt);

            emailService.sendCredentialEmail(user.getPersonalEmail(), finalEmail, "ecm123");
            return "Success! Your ECM email is: " + finalEmail;
        }
    }

    private String generateOTP() {
        int randomPin = (int) (Math.random() * 900000) + 100000;
        return String.valueOf(randomPin);
    }

    private String generateUniqueEcmEmail(String firstName, String lastName) {
        String prefix = EmailUtils.generateEmailPrefix(firstName, lastName);
        String finalEmail = prefix + "@ecm.edu.vn";

        int count = 0;
        while (userRepository.existsByEmail(finalEmail)) {
            count++;
            finalEmail = prefix + count + "@ecm.edu.vn";
        }
        return finalEmail;
    }

    @Transactional
    public String deleteStudentPermanently(Long studentId) {
        userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("User not found!"));
        throw new RuntimeException("Users cannot be deleted.");
    }

    private String rollOutStudent(User student) {
        enrollmentRepository.deleteByStudentId(student.getId());
        student.getConnectedCenters().clear();
        student.setEnabled(false);
        userRepository.save(student);
        return "Student rolled out successfully.";
    }

    private User getOwnedStudent(Long teacherId, Long studentId) {
        getAuthorizedTeacherActor(teacherId);

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found!"));

        if (!"STUDENT".equals(student.getRole().getName())) {
            throw new RuntimeException("Target user is not a student.");
        }

        if (student.getCreatedByTeacher() == null || !teacherId.equals(student.getCreatedByTeacher().getId())) {
            throw new RuntimeException("Only the teacher who created this student can manage this account.");
        }

        return student;
    }

    private User getAuthorizedTeacherActor(Long teacherId) {
        User actor = getCurrentUser();

        if (isAdmin(actor)) {
            return userRepository.findById(teacherId)
                    .orElseThrow(() -> new RuntimeException("Teacher not found!"));
        }

        if (!isTeacher(actor)) {
            throw new RuntimeException("Only teachers can manage students.");
        }

        if (!actor.getId().equals(teacherId)) {
            throw new RuntimeException("You do not have permission to manage another teacher's students.");
        }

        return actor;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Authentication is required.");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
    }

    private User getAccessibleUser(Long userId) {
        User actor = getCurrentUser();

        if (!isAdmin(actor) && !actor.getId().equals(userId)) {
            throw new RuntimeException("You do not have permission to access this user.");
        }

        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));
    }

    private boolean isAdmin(User user) {
        return user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName());
    }

    private boolean isTeacher(User user) {
        if (user.getRole() == null || user.getRole().getName() == null) {
            return false;
        }

        String roleName = user.getRole().getName();
        return "TEACHER".equalsIgnoreCase(roleName);
    }

    private User getActiveOwnedStudent(Long teacherId, Long studentId) {
        User student = getOwnedStudent(teacherId, studentId);

        if (!student.isEnabled()) {
            throw new RuntimeException("Rolled out students cannot be changed.");
        }

        return student;
    }

    private TeacherStudentResponse toTeacherStudentResponse(User student, Long teacherId) {
        List<TeacherStudentResponse.ConnectedCenterResponse> centers = student.getConnectedCenters().stream()
                .map(center -> new TeacherStudentResponse.ConnectedCenterResponse(center.getId(), center.getName()))
                .sorted(Comparator.comparing(TeacherStudentResponse.ConnectedCenterResponse::getName,
                        String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());

        boolean canManage = student.getCreatedByTeacher() != null
                && teacherId.equals(student.getCreatedByTeacher().getId());

        return new TeacherStudentResponse(
                student.getId(),
                student.getFirstName(),
                student.getLastName(),
                student.getEmail(),
                student.getPhoneNumber(),
                student.getDateOfBirth(),
                canManage,
                centers);
    }
}
