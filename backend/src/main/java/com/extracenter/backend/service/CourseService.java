package com.extracenter.backend.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.dto.ClassSessionCreateRequest;
import com.extracenter.backend.dto.ClassSessionUpdateRequest;
import com.extracenter.backend.dto.CourseRequest;
import com.extracenter.backend.dto.CourseSessionResponse;
import com.extracenter.backend.dto.CourseSessionSlotOptionResponse;
import com.extracenter.backend.entity.Center;
import com.extracenter.backend.entity.ClassSession;
import com.extracenter.backend.entity.ClassSlot;
import com.extracenter.backend.entity.Course;
import com.extracenter.backend.entity.CourseStatus;
import com.extracenter.backend.entity.Enrollment;
import com.extracenter.backend.entity.Grade;
import com.extracenter.backend.entity.ScoreCategory;
import com.extracenter.backend.entity.Subject;
import com.extracenter.backend.entity.User;
import com.extracenter.backend.entity.VerificationToken;
import com.extracenter.backend.repository.AssignmentRepository;
import com.extracenter.backend.repository.AssignmentSubmissionRepository;
import com.extracenter.backend.repository.AttendanceRepository;
import com.extracenter.backend.repository.CenterRepository;
import com.extracenter.backend.repository.ClassSessionRepository;
import com.extracenter.backend.repository.ClassSlotRepository;
import com.extracenter.backend.repository.CourseRepository;
import com.extracenter.backend.repository.EnrollmentRepository;
import com.extracenter.backend.repository.GradeRepository;
import com.extracenter.backend.repository.MaterialRepository;
import com.extracenter.backend.repository.ScoreCategoryRepository;
import com.extracenter.backend.repository.SubjectRepository;
import com.extracenter.backend.repository.UserRepository;
import com.extracenter.backend.repository.VerificationTokenRepository;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private ClassSlotRepository classSlotRepository;
    @Autowired
    private ClassSessionRepository classSessionRepository; // ADDED THIS
    @Autowired
    private AttendanceRepository attendanceRepository;
    @Autowired
    private AssignmentRepository assignmentRepository;
    @Autowired
    private AssignmentSubmissionRepository assignmentSubmissionRepository;
    @Autowired
    private CenterRepository centerRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SubjectRepository subjectRepository;
    @Autowired
    private GradeRepository gradeRepository;
    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private ScoreCategoryRepository scoreCategoryRepository;

    @Autowired
    private ScoreCategoryService scoreCategoryService;

    // THÊM REPOSITORY NÀY ĐỂ QUẢN LÝ VIỆC ĐĂNG KÝ HỌC
    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private VerificationTokenRepository verificationTokenRepository;

    @Autowired
    private EmailService emailService;

    @Transactional
    public Course createCourse(CourseRequest request) {
        // 1. Find Center and Teacher
        Center center = centerRepository.findById(request.getCenterId())
                .orElseThrow(() -> new RuntimeException("Center not found!"));
        User teacher = userRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found!"));

        // 2. Create and save the Course
        Course course = new Course();
        course.setName(request.getName());
        // Tuition fee base (VND) used for tracking student tuition offline
        course.setTuitionFeeVnd(request.getTuitionFeeVnd());


        if (request.getSubjectId() != null) {
            Subject subject = subjectRepository.findById(request.getSubjectId())
                    .orElseThrow(() -> new RuntimeException("Subject does not exist"));
            course.setSubject(subject);
        } else {
            course.setSubject(null);
        }

        if (request.getGradeId() != null) {
            Grade grade = gradeRepository.findById(request.getGradeId())
                    .orElseThrow(() -> new RuntimeException("Grade does not exist"));
            course.setGrade(grade);
        } else {
            course.setGrade(null);
        }

        applyCourseRequest(course, request, center, teacher, true);

        Course savedCourse = courseRepository.save(course);

        // 3. Create and save the ClassSlots (The generic schedule rules)
        List<ClassSlot> savedSlots = new ArrayList<>();
        if (request.getSlots() != null && !request.getSlots().isEmpty()) {
            for (CourseRequest.SlotRequest slotReq : request.getSlots()) {
                ClassSlot slot = new ClassSlot();
                slot.setDaysOfWeek(Collections.singleton(slotReq.getDayOfWeek()));
                slot.setStartTime(slotReq.getStartTime());
                slot.setEndTime(slotReq.getEndTime());
                slot.setStartDate(savedCourse.getStartDate());
                slot.setEndDate(savedCourse.getEndDate());
                slot.setIsRecurring(true);
                slot.setCenter(center);
                slot.setCourse(savedCourse);
                savedSlots.add(classSlotRepository.save(slot));
            }
        }

        // 4. THE MAGIC: Automatically generate the physical calendar days
        // (ClassSessions)
        if (!savedSlots.isEmpty() && course.getStartDate() != null && course.getEndDate() != null) {
            generateClassSessions(savedCourse, savedSlots);
        }

        // 5. Create default score categories for the course
        createDefaultScoreCategories(savedCourse);

        return savedCourse;
    }

    // Helper method to generate ClassSessions based on the start/end date and slot
    // rules
    private void generateClassSessions(Course course, List<ClassSlot> slots) {
        List<ClassSession> sessionsToSave = new ArrayList<>();
        LocalDate currentDate = course.getStartDate();
        LocalDate endDate = course.getEndDate();

        while (!currentDate.isAfter(endDate)) {
            // Java DayOfWeek: 1=Monday, 7=Sunday. Matches your convention!
            DayOfWeek currentDayOfWeek = currentDate.getDayOfWeek();

            for (ClassSlot slot : slots) {
                if (slot.getDaysOfWeek() != null && slot.getDaysOfWeek().contains(currentDayOfWeek)) {
                    ClassSession session = new ClassSession();
                    session.setCourse(course);
                    session.setDate(currentDate);
                    session.setStartTime(slot.getStartTime());
                    session.setEndTime(slot.getEndTime());
                    sessionsToSave.add(session);
                }
            }
            currentDate = currentDate.plusDays(1); // Move to next day
        }

        // Batch save for high performance
        classSessionRepository.saveAll(sessionsToSave);
    }

    // Helper method to create default score categories for a course
    private void createDefaultScoreCategories(Course course) {
        // Create "Assignment" category with 20% weight
        ScoreCategory assignmentCategory = new ScoreCategory();
        assignmentCategory.setName("Assignment");
        assignmentCategory.setWeight(20);
        assignmentCategory.setCourse(course);
        scoreCategoryRepository.save(assignmentCategory);

        // Create "Final Exam" category with 80% weight
        ScoreCategory finalExamCategory = new ScoreCategory();
        finalExamCategory.setName("Final Exam");
        finalExamCategory.setWeight(80);
        finalExamCategory.setCourse(course);
        scoreCategoryRepository.save(finalExamCategory);
    }


    public List<Course> getAllCourses() {
        return courseRepository.findAll().stream()
            .map(this::syncCourseStatus)
            .collect(Collectors.toList());
    }

    public List<Course> getCoursesByTeacher(Long teacherId) {
        validateTeacherCourseAccess(teacherId);
        return courseRepository.findByTeacherId(teacherId).stream()
            .map(this::syncCourseStatus)
            .collect(Collectors.toList());
    }

    public List<Course> getCoursesByStudentId(Long studentId) {
        return courseRepository.findByStudentId(studentId).stream()
            .map(this::syncCourseStatus)
            .collect(Collectors.toList());
    }

    public List<Course> getCoursesByCenter(Long centerId) {
        return courseRepository.findByCenterId(centerId).stream()
            .map(this::syncCourseStatus)
            .collect(Collectors.toList());
    }

    public List<Course> getVisibleCoursesByCenter(Long centerId) {
        User currentUser = getCurrentUser();

        if (isAdmin(currentUser)) {
            return getCoursesByCenter(centerId);
        }

        Center center = centerRepository.findById(centerId)
                .orElseThrow(() -> new RuntimeException("Center not found!"));

        if (center.getManager() != null && center.getManager().getId().equals(currentUser.getId())) {
            return getCoursesByCenter(centerId);
        }

        if (isTeacher(currentUser)) {
            return courseRepository.findByCenterIdAndTeacherId(centerId, currentUser.getId()).stream()
                    .map(this::syncCourseStatus)
                    .collect(Collectors.toList());
        }

        throw new RuntimeException("You do not have permission to view courses in this center.");
    }

    public Course getCourseById(Long id) {
        Course course = courseRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Course not found!"));
        validateCourseViewer(course);
        return syncCourseStatus(course);
    }

    @Transactional
    public List<CourseSessionResponse> getClassSessionsByCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        validateCourseViewer(course);

        synchronizeSessionsFromActiveClassSlots(course);

        return classSessionRepository.findByCourseIdOrderByDateAsc(courseId)
                .stream()
                .map(session -> mapToSessionResponse(session, findMatchingSlot(session)))
                .filter(response -> response.getClassSlotId() != null)
                .collect(Collectors.toList());
    }

    public List<CourseSessionSlotOptionResponse> getSessionSlotOptionsByCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        validateCourseViewer(course);

        return classSlotRepository.findByCourseId(courseId)
                .stream()
                .map(slot -> CourseSessionSlotOptionResponse.builder()
                        .classSlotId(slot.getId())
                        .startDate(slot.getStartDate())
                        .endDate(slot.getEndDate())
                        .startTime(slot.getStartTime())
                        .endTime(slot.getEndTime())
                        .daysOfWeek(slot.getDaysOfWeek())
                        .classroomId(slot.getClassroom() != null ? slot.getClassroom().getId() : null)
                        .classroomLocation(slot.getClassroom() != null ? slot.getClassroom().getLocation() : null)
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public CourseSessionResponse createClassSession(Long courseId, ClassSessionCreateRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        validateSessionEditor(course, request.getActorId(), "create");

        ClassSlot slot = classSlotRepository.findById(request.getClassSlotId())
                .orElseThrow(() -> new RuntimeException("Class slot not found."));
        validateSlotBelongsToCourse(courseId, slot);
        validateDateFitsSlot(request.getDate(), slot);

        if (classSessionRepository.existsByCourseIdAndDateAndStartTimeAndEndTime(
                courseId,
                request.getDate(),
                slot.getStartTime(),
                slot.getEndTime())) {
            throw new RuntimeException("This session already exists.");
        }

        ClassSession session = new ClassSession();
        session.setCourse(course);
        session.setDate(request.getDate());
        session.setStartTime(slot.getStartTime());
        session.setEndTime(slot.getEndTime());
        session.setStatus("SCHEDULED");
        session.setNote(request.getNote());

        ClassSession saved = classSessionRepository.save(session);
        return mapToSessionResponse(saved, slot);
    }

    @Transactional
    public CourseSessionResponse updateClassSession(Long courseId, Long sessionId, ClassSessionUpdateRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found!"));
        validateSessionEditor(course, request.getActorId(), "edit");

        ClassSession session = classSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Class session not found."));

        if (!session.getCourse().getId().equals(courseId)) {
            throw new RuntimeException("Class session does not belong to this course.");
        }

        ClassSlot slot = classSlotRepository.findById(request.getClassSlotId())
                .orElseThrow(() -> new RuntimeException("Class slot not found."));
        validateSlotBelongsToCourse(courseId, slot);
        validateDateFitsSlot(request.getDate(), slot);

        if (classSessionRepository.existsByCourseIdAndDateAndStartTimeAndEndTimeAndIdNot(
                courseId,
                request.getDate(),
                slot.getStartTime(),
                slot.getEndTime(),
                sessionId)) {
            throw new RuntimeException("Another session already exists for this slot and date.");
        }

        session.setDate(request.getDate());
        session.setStartTime(slot.getStartTime());
        session.setEndTime(slot.getEndTime());
        session.setNote(request.getNote());

        ClassSession saved = classSessionRepository.save(session);
        return mapToSessionResponse(saved, slot);
    }

    @Transactional
    public void deleteClassSession(Long courseId, Long sessionId, Long actorId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found!"));
        validateSessionEditor(course, actorId, "delete");

        ClassSession session = classSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Class session not found."));

        if (!session.getCourse().getId().equals(courseId)) {
            throw new RuntimeException("Class session does not belong to this course.");
        }

        attendanceRepository.deleteByClassSessionId(sessionId);
        classSessionRepository.delete(session);
    }

    @Transactional
    public Course updateCourse(Long courseId, CourseRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        Center center = centerRepository.findById(request.getCenterId())
            .orElseThrow(() -> new RuntimeException("Center not found!"));
        User teacher = userRepository.findById(request.getTeacherId())
            .orElseThrow(() -> new RuntimeException("Teacher not found!"));

        applyCourseRequest(course, request, center, teacher, course.getStatus() != CourseStatus.ENDED);

        return courseRepository.save(course);
        }

        @Transactional
        public Course endCourseEarly(Long courseId) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found!"));

        if (course.getStatus() == CourseStatus.ENDED) {
            throw new RuntimeException("Course is already ended.");
        }

        course.setStatus(CourseStatus.ENDED);
        return courseRepository.save(course);
        }

        @Transactional
        public Course reopenCourse(Long courseId, CourseRequest request) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found!"));

        Center center = centerRepository.findById(request.getCenterId())
            .orElseThrow(() -> new RuntimeException("Center not found!"));
        User teacher = userRepository.findById(request.getTeacherId())
            .orElseThrow(() -> new RuntimeException("Teacher not found!"));

        applyCourseRequest(course, request, center, teacher, true);

        if (course.getStatus() == CourseStatus.ENDED) {
            throw new RuntimeException("Updated dates still result in an ended course. Please choose a current or future range.");
        }

        return courseRepository.save(course);
        }

        private void applyCourseRequest(Course course, CourseRequest request, Center center, User teacher,
            boolean deriveStatusFromDates) {
        validateCourseDates(request.getStartDate(), request.getEndDate());

        course.setName(request.getName());

        if (request.getSubjectId() != null) {
            Subject subject = subjectRepository.findById(request.getSubjectId())
                    .orElseThrow(() -> new RuntimeException("Subject does not exist"));
            course.setSubject(subject);
        } else {
            course.setSubject(null);
        }

        if (request.getGradeId() != null) {
            Grade grade = gradeRepository.findById(request.getGradeId())
                    .orElseThrow(() -> new RuntimeException("Grade does not exist"));
            course.setGrade(grade);
        } else {
            course.setGrade(null);
        }

        course.setDescription(request.getDescription());
        course.setStartDate(request.getStartDate());
        course.setEndDate(request.getEndDate());
        course.setCenter(center);
        course.setTeacher(teacher);
        course.setTuitionFeeVnd(request.getTuitionFeeVnd());

        if (deriveStatusFromDates) {
            course.setStatus(deriveStatusFromDates(course.getStartDate(), course.getEndDate()));

        }
    }

    private void validateCourseDates(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new RuntimeException("Start date and end date are required.");
        }

        if (endDate.isBefore(startDate)) {
            throw new RuntimeException("End date must be on or after start date.");
        }
    }

    @Transactional
    public void deleteCourse(Long courseId) {
        throw new RuntimeException("Course deletion requires OTP verification.");
    }

    @Transactional
    public void sendDeleteCourseOtp(Long courseId, Long managerId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        User owner = course.getCenter().getManager();
        if (!owner.getId().equals(managerId)) {
            throw new RuntimeException("You do not have permission to delete this course.");
        }

        validateCourseDeletionEligibility(course);

        String otp = generateOtp();
        VerificationToken token = verificationTokenRepository.findByUser(owner)
                .orElseGet(() -> new VerificationToken(owner, otp));

        token.setToken(otp);
        token.setExpiryDate(LocalDateTime.now().plusMinutes(10));
        verificationTokenRepository.save(token);

        emailService.sendCourseDeleteOtpEmail(owner.getPersonalEmail(), course.getName(), otp);
    }

    @Transactional
    public void deleteCourseWithOtp(Long courseId, Long managerId, String otp) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        User owner = course.getCenter().getManager();
        if (!owner.getId().equals(managerId)) {
            throw new RuntimeException("You do not have permission to delete this course.");
        }

        VerificationToken token = verificationTokenRepository.findByUser(owner)
                .orElseThrow(() -> new RuntimeException("OTP not found. Please request a new OTP."));

        if (!token.getToken().equals(otp) || token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Invalid or expired OTP.");
        }

        validateCourseDeletionEligibility(course);

        deleteCourseAndRelatedData(courseId);
        verificationTokenRepository.delete(token);
    }

    private void validateCourseDeletionEligibility(Course course) {
        if (course.getStatus() != CourseStatus.ENDED) {
            throw new RuntimeException("Only ended courses can be deleted.");
        }

        Long courseId = course.getId();
        LocalDate today = LocalDate.now();

        boolean hasActiveSessions = classSessionRepository.existsByCourseIdAndDateGreaterThanEqual(courseId, today);
        boolean hasActiveSlots = classSlotRepository.existsByCourseIdAndEndDateGreaterThanEqual(courseId, today);

        if (hasActiveSessions || hasActiveSlots) {
            throw new RuntimeException("Cannot delete this course while it still has active classes.");
        }
    }

    private void deleteCourseAndRelatedData(Long courseId) {
        try {
            attendanceRepository.deleteByCourseId(courseId);
            assignmentSubmissionRepository.deleteByCourseId(courseId);
            assignmentRepository.deleteByCourseId(courseId);
            materialRepository.deleteByCourseId(courseId);
            enrollmentRepository.deleteByCourseId(courseId);
            classSessionRepository.deleteByCourseId(courseId);
            classSlotRepository.deleteByCourseId(courseId);
            courseRepository.deleteById(courseId);
        } catch (Exception e) {
            throw new RuntimeException("Error deleting course: " + e.getMessage());
        }
    }

    private String generateOtp() {
        int randomPin = (int) (Math.random() * 900000) + 100000;
        return String.valueOf(randomPin);
    }

    @Transactional
    public void inviteTeacherToCourse(Long courseId, String teacherEmail) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        User invitedUser = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new RuntimeException("Teacher not found!"));

        if (!"TEACHER".equalsIgnoreCase(invitedUser.getRole().getName())) {
            throw new RuntimeException("This user is not registered as a Teacher!");
        }

        course.setPendingTeacher(invitedUser);
        course.setInvitationStatus("PENDING");
        courseRepository.save(course);
    }

    @Transactional
    public Course assignTeacherToCourse(Long courseId, Long teacherId, Long managerId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        if (!course.getCenter().getManager().getId().equals(managerId)) {
            throw new RuntimeException("You do not have permission to assign teacher for this course.");
        }

        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found!"));

        if (!"TEACHER".equalsIgnoreCase(teacher.getRole().getName())) {
            throw new RuntimeException("Selected user is not a teacher.");
        }

        boolean isLinkedToCenter = teacher.getConnectedCenters().stream()
                .anyMatch(c -> c.getId().equals(course.getCenter().getId()));
        if (!isLinkedToCenter) {
            throw new RuntimeException("Teacher is not linked to this center.");
        }

        course.setTeacher(teacher);
        course.setPendingTeacher(null);
        course.setInvitationStatus("ACCEPTED");
        return courseRepository.save(course);
    }

    @Transactional
    public void respondToInvitation(Long courseId, String status) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        if ("ACCEPTED".equals(status)) {
            course.setTeacher(course.getPendingTeacher());
            course.setPendingTeacher(null);
            course.setInvitationStatus("ACCEPTED");
        } else if ("REJECTED".equals(status)) {
            course.setPendingTeacher(null);
            course.setInvitationStatus("REJECTED");
        }
        courseRepository.save(course);
    }

    public List<Course> getPendingInvitations(Long teacherId) {
        return courseRepository.findPendingInvitations(teacherId);
    }

    // =================================================================
    // ENROLLMENT MANAGEMENT
    // =================================================================

    @Transactional
    public void addStudentToCourse(Long courseId, Long studentId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found!"));

        // 1. Check if enrollment already exists
        boolean exists = enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId);
        if (exists) {
            throw new RuntimeException("Student is already enrolled in this class!");
        }

        // 2. Create new Enrollment
        Enrollment enrollment = new Enrollment();
        enrollment.setCourse(course);
        enrollment.setStudent(student);
        enrollmentRepository.save(enrollment);

        // 3. Link student to Center (if not already linked)
        if (course.getCenter() != null) {
            boolean isAlreadyInCenter = student.getConnectedCenters().stream()
                    .anyMatch(c -> c.getId().equals(course.getCenter().getId()));

            if (!isAlreadyInCenter) {
                student.getConnectedCenters().add(course.getCenter());
                userRepository.save(student);
            }
        }
    }

    @Transactional
    public void removeStudentFromCourse(Long courseId, Long studentId) {
        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new RuntimeException("Student is not enrolled in this class!"));

        enrollmentRepository.delete(enrollment);
    }

    // Retrieve list of students via Enrollment repository for better performance
    public Set<User> getCourseStudents(Long courseId) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found!"));
        validateCourseViewer(course);

        // OPTIMIZATION: Instead of loading the Course and relying on Lazy Loading,
        // we query the EnrollmentRepository directly!
        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);

        return enrollments.stream()
                .map(Enrollment::getStudent)
                .collect(Collectors.toSet());
    }

    private void validateSessionEditor(Course course, Long actorId, String action) {
        boolean isTeacher = course.getTeacher() != null && course.getTeacher().getId().equals(actorId);
        boolean isManager = course.getCenter() != null
                && course.getCenter().getManager() != null
                && course.getCenter().getManager().getId().equals(actorId);

        if (!isTeacher && !isManager) {
            throw new RuntimeException("Only assigned teacher or center manager can " + action + " sessions.");
        }
    }

    private void validateCourseViewer(Course course) {
        User currentUser = getCurrentUser();

        if (isAdmin(currentUser)) {
            return;
        }

        boolean isManager = course.getCenter() != null
                && course.getCenter().getManager() != null
                && course.getCenter().getManager().getId().equals(currentUser.getId());

        boolean isAssignedTeacher = course.getTeacher() != null
                && course.getTeacher().getId().equals(currentUser.getId());

        boolean isEnrolledStudent = isStudent(currentUser)
                && enrollmentRepository.existsByStudentIdAndCourseId(currentUser.getId(), course.getId());

        if (!isManager && !isAssignedTeacher && !isEnrolledStudent) {
            throw new RuntimeException("You do not have permission to view this course.");
        }
    }

    private void validateTeacherCourseAccess(Long teacherId) {
        User currentUser = getCurrentUser();
        if (isAdmin(currentUser)) {
            return;
        }

        if (isTeacher(currentUser) && currentUser.getId().equals(teacherId)) {
            return;
        }

        throw new RuntimeException("You do not have permission to view these courses.");
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Authentication is required.");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
    }

    private boolean isAdmin(User user) {
        return user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName());
    }

    private boolean isTeacher(User user) {
        return user.getRole() != null && "TEACHER".equalsIgnoreCase(user.getRole().getName());
    }

    private boolean isStudent(User user) {
        return user.getRole() != null && "STUDENT".equalsIgnoreCase(user.getRole().getName());
    }

    private Course syncCourseStatus(Course course) {
        if (course == null) {
            return null;
        }

        if (course.getStatus() == CourseStatus.ENDED) {
            return course;
        }

        CourseStatus derivedStatus = deriveStatusFromDates(course.getStartDate(), course.getEndDate());
        if (course.getStatus() != derivedStatus) {
            course.setStatus(derivedStatus);
            return courseRepository.save(course);
        }

        return course;
    }

    private CourseStatus deriveStatusFromDates(LocalDate startDate, LocalDate endDate) {
        LocalDate today = LocalDate.now();

        if (startDate == null || endDate == null) {
            return CourseStatus.UPCOMING;
        }

        if (today.isBefore(startDate)) {
            return CourseStatus.UPCOMING;
        }

        if (today.isAfter(endDate)) {
            return CourseStatus.ENDED;
        }

        return CourseStatus.IN_PROGRESS;
    }

    private void validateSlotBelongsToCourse(Long courseId, ClassSlot slot) {
        if (slot.getCourse() == null || !slot.getCourse().getId().equals(courseId)) {
            throw new RuntimeException("Selected class slot does not belong to this course.");
        }
    }

    private void validateDateFitsSlot(LocalDate date, ClassSlot slot) {
        if (date.isBefore(slot.getStartDate()) || date.isAfter(slot.getEndDate())) {
            throw new RuntimeException("Session date must be inside selected class slot date range.");
        }

        Set<DayOfWeek> effectiveDays = slot.getDaysOfWeek();
        if ((effectiveDays == null || effectiveDays.isEmpty()) && slot.getDayOfWeek() != null) {
            effectiveDays = Set.of(slot.getDayOfWeek());
        }

        if (effectiveDays == null || effectiveDays.isEmpty() || !effectiveDays.contains(date.getDayOfWeek())) {
            throw new RuntimeException("Session date does not match selected class slot day of week.");
        }

        if (slot.getExcludedDates() != null && slot.getExcludedDates().contains(date)) {
            throw new RuntimeException("Selected date is excluded from this class slot.");
        }
    }

    private void synchronizeSessionsFromActiveClassSlots(Course course) {
        if (course.getStartDate() == null || course.getEndDate() == null) {
            return;
        }

        List<ClassSlot> activeSlots = classSlotRepository.findByCourseId(course.getId())
                .stream()
                .filter(slot -> slot.getClassroom() != null)
                .collect(Collectors.toList());

        if (activeSlots.isEmpty()) {
            return;
        }

        Set<String> existingKeys = classSessionRepository.findByCourseIdOrderByDateAsc(course.getId())
                .stream()
                .map(this::buildSessionKey)
                .collect(Collectors.toCollection(HashSet::new));

        List<ClassSession> sessionsToCreate = new ArrayList<>();

        for (ClassSlot slot : activeSlots) {
            LocalDate slotStart = slot.getStartDate() != null && slot.getStartDate().isAfter(course.getStartDate())
                    ? slot.getStartDate()
                    : course.getStartDate();
            LocalDate slotEnd = slot.getEndDate() != null && slot.getEndDate().isBefore(course.getEndDate())
                    ? slot.getEndDate()
                    : course.getEndDate();

            if (slotStart.isAfter(slotEnd) || slot.getStartTime() == null || slot.getEndTime() == null) {
                continue;
            }

            Set<DayOfWeek> effectiveDays = slot.getDaysOfWeek();
            if ((effectiveDays == null || effectiveDays.isEmpty()) && slot.getDayOfWeek() != null) {
                effectiveDays = Set.of(slot.getDayOfWeek());
            }

            if (effectiveDays == null || effectiveDays.isEmpty()) {
                continue;
            }

            LocalDate current = slotStart;
            while (!current.isAfter(slotEnd)) {
                boolean isExcluded = slot.getExcludedDates() != null && slot.getExcludedDates().contains(current);
                if (!isExcluded && effectiveDays.contains(current.getDayOfWeek())) {
                    String key = current + "|" + slot.getStartTime() + "|" + slot.getEndTime();
                    if (!existingKeys.contains(key)) {
                        ClassSession session = new ClassSession();
                        session.setCourse(course);
                        session.setDate(current);
                        session.setStartTime(slot.getStartTime());
                        session.setEndTime(slot.getEndTime());
                        session.setStatus("SCHEDULED");
                        sessionsToCreate.add(session);
                        existingKeys.add(key);
                    }
                }

                current = current.plusDays(1);
            }
        }

        if (!sessionsToCreate.isEmpty()) {
            classSessionRepository.saveAll(sessionsToCreate);
        }
    }

    private String buildSessionKey(ClassSession session) {
        return session.getDate() + "|" + session.getStartTime() + "|" + session.getEndTime();
    }

    private ClassSlot findMatchingSlot(ClassSession session) {
        LocalDate date = session.getDate();

        for (ClassSlot slot : classSlotRepository.findByCourseId(session.getCourse().getId())) {
            if (date.isBefore(slot.getStartDate()) || date.isAfter(slot.getEndDate())) {
                continue;
            }

            Set<DayOfWeek> effectiveDays = slot.getDaysOfWeek();
            if ((effectiveDays == null || effectiveDays.isEmpty()) && slot.getDayOfWeek() != null) {
                effectiveDays = Set.of(slot.getDayOfWeek());
            }

            if (effectiveDays == null || !effectiveDays.contains(date.getDayOfWeek())) {
                continue;
            }

            if (slot.getExcludedDates() != null && slot.getExcludedDates().contains(date)) {
                continue;
            }

            if (slot.getStartTime() == null || slot.getEndTime() == null
                    || !slot.getStartTime().equals(session.getStartTime())
                    || !slot.getEndTime().equals(session.getEndTime())) {
                continue;
            }

            return slot;
        }

        return null;
    }

    private CourseSessionResponse mapToSessionResponse(ClassSession session, ClassSlot slot) {
        return CourseSessionResponse.builder()
                .id(session.getId())
                .date(session.getDate())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .status(session.getStatus())
                .note(session.getNote())
                .classSlotId(slot != null ? slot.getId() : null)
                .classroomId(slot != null && slot.getClassroom() != null ? slot.getClassroom().getId() : null)
                .classroomLocation(
                        slot != null && slot.getClassroom() != null ? slot.getClassroom().getLocation() : null)
                .build();
    }
}