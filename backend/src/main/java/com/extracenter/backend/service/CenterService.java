package com.extracenter.backend.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.dto.CenterRequest;
import com.extracenter.backend.dto.ClassSlotOccurrenceOverrideRequest;
import com.extracenter.backend.dto.ClassSlotRequest;
import com.extracenter.backend.dto.ClassroomRequest;
import com.extracenter.backend.entity.Center;
import com.extracenter.backend.entity.ClassSlot;
import com.extracenter.backend.entity.Classroom;
import com.extracenter.backend.entity.Course;
import com.extracenter.backend.entity.CourseStatus;
import com.extracenter.backend.entity.Grade;
import com.extracenter.backend.entity.Subject;
import com.extracenter.backend.entity.User;
import com.extracenter.backend.repository.AttendanceRepository;
import com.extracenter.backend.repository.CenterRepository;
import com.extracenter.backend.repository.ClassSlotRepository;
import com.extracenter.backend.repository.ClassroomRepository;
import com.extracenter.backend.repository.CourseRepository;
import com.extracenter.backend.repository.EnrollmentRepository;
import com.extracenter.backend.repository.GradeRepository;
import com.extracenter.backend.repository.SubjectRepository;
import com.extracenter.backend.repository.UserRepository;

@Service
public class CenterService {

    @Autowired
    private CenterRepository centerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private GradeRepository gradeRepository;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private ClassSlotRepository classSlotRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private CourseService courseService;

    // 1. Create a new Center
    // @Transactional added: If saving the center works but updating the manager
    // fails, we roll back!
    @Transactional
    public Center createCenter(CenterRequest request) {
        User manager = userRepository.findById(request.getManagerId())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + request.getManagerId()));

        Center newCenter = new Center();
        newCenter.setName(request.getName());
        newCenter.setDescription(request.getDescription());
        newCenter.setPhoneNumber(request.getPhoneNumber());
        newCenter.setManager(manager);

        Center savedCenter = centerRepository.save(newCenter);

        // Link the manager to this center in the Many-to-Many join table
        manager.getConnectedCenters().add(savedCenter);
        userRepository.save(manager);

        return savedCenter;
    }

    // 2. Get list of all Centers
    public List<Center> getAllCenters() {
        return centerRepository.findByArchivedAtIsNull();
    }

    // 3. Get Centers managed by a specific user
    public List<Center> getCentersByManager(Long managerId) {
        return centerRepository.findByManagerIdAndArchivedAtIsNull(managerId);
    }

    public List<Center> getArchivedCentersByManager(Long managerId) {
        return centerRepository.findByManagerIdAndArchivedAtIsNotNullOrderByArchivedAtDesc(managerId);
    }

    // 4. Get Center by ID
    public Center getCenterById(Long id) {
        return getAccessibleCenterForCurrentUser(id);
    }

    // 5. Get list of Centers where a teacher is currently teaching (Guest Teacher)
    public List<Center> getCentersTeaching(Long teacherId) {
        List<Center> fromCourses = centerRepository.findCentersTeachingByTeacherId(teacherId);
        List<Center> fromLinks = centerRepository.findLinkedCentersByTeacherId(teacherId);

        Map<Long, Center> uniqueCenters = new LinkedHashMap<>();
        for (Center center : fromCourses) {
            uniqueCenters.put(center.getId(), center);
        }
        for (Center center : fromLinks) {
            uniqueCenters.put(center.getId(), center);
        }

        return List.copyOf(uniqueCenters.values());
    }

    public List<Center> getPendingInvitedCenters(Long teacherId) {
        return centerRepository.findPendingInvitedCentersByTeacherId(teacherId);
    }

    // Subject / Grade management for a Center
    public List<Subject> getSubjectsByCenter(Long centerId) {
        getOwnedCenterForCurrentUser(centerId);
        return subjectRepository.findByCenterId(centerId);
    }

    public Subject createSubject(Long centerId, String name, String description) {
        Center center = getEditableCenter(centerId);

        Subject subject = new Subject();
        subject.setName(name);
        subject.setDescription(description);
        subject.setCenter(center);

        return subjectRepository.save(subject);
    }

    public Subject updateSubject(Long centerId, Long subjectId, String name, String description) {
        getEditableCenter(centerId);

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject does not exist!"));

        if (!subject.getCenter().getId().equals(centerId)) {
            throw new RuntimeException("Course does not belong to this center.");
        }

        subject.setName(name);
        subject.setDescription(description);

        return subjectRepository.save(subject);
    }

    public void deleteSubject(Long centerId, Long subjectId) {
        getEditableCenter(centerId);

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject does not exist!"));

        if (!subject.getCenter().getId().equals(centerId)) {
            throw new RuntimeException("Subject does not belong to this center.");
        }

        if (courseRepository.existsBySubjectId(subjectId)) {
            throw new RuntimeException("Cannot delete this subject because it is already used by one or more courses.");
        }

        subjectRepository.delete(subject);
    }

    public List<Grade> getGradesByCenter(Long centerId) {
        getOwnedCenterForCurrentUser(centerId);
        return gradeRepository.findByCenterId(centerId);
    }

    private void validateAge(Integer age, String fieldName) {
        if (age != null) {
            if (age < 3 || age > 100) {
                throw new RuntimeException(fieldName + " must be between 3 and 100.");
            }
        }
    }

    public Grade createGrade(Long centerId, String name, Integer fromAge, Integer toAge, String description) {
        Center center = getEditableCenter(centerId);

        validateAge(fromAge, "From age");
        validateAge(toAge, "To age");
        if (fromAge != null && toAge != null && fromAge > toAge) {
            throw new RuntimeException("From age must be less than or equal to To age.");
        }

        Grade grade = new Grade();
        grade.setName(name);
        grade.setFromAge(fromAge);
        grade.setToAge(toAge);
        grade.setDescription(description);
        grade.setCenter(center);

        return gradeRepository.save(grade);
    }

    public Grade updateGrade(Long centerId, Long gradeId, String name, Integer fromAge, Integer toAge,
            String description) {
        getEditableCenter(centerId);

        Grade grade = gradeRepository.findById(gradeId)
                .orElseThrow(() -> new RuntimeException("Grade does not exist!"));

        if (!grade.getCenter().getId().equals(centerId)) {
            throw new RuntimeException("Grade does not belong to this center.");
        }

        validateAge(fromAge, "From age");
        validateAge(toAge, "To age");
        if (fromAge != null && toAge != null && fromAge > toAge) {
            throw new RuntimeException("From age must be less than or equal to To age.");
        }

        grade.setName(name);
        grade.setFromAge(fromAge);
        grade.setToAge(toAge);
        grade.setDescription(description);

        return gradeRepository.save(grade);
    }

    public void deleteGrade(Long centerId, Long gradeId) {
        getEditableCenter(centerId);

        Grade grade = gradeRepository.findById(gradeId)
                .orElseThrow(() -> new RuntimeException("Grade does not exist!"));

        if (!grade.getCenter().getId().equals(centerId)) {
            throw new RuntimeException("Grade does not belong to this center.");
        }

        if (courseRepository.existsByGradeId(gradeId)) {
            throw new RuntimeException("Cannot delete this grade because it is already used by one or more courses.");
        }

        gradeRepository.delete(grade);
    }

    // 2. Cập nhật Trung tâm
    // 6. Update Center details
    @Transactional
    public Center updateCenter(Long centerId, CenterRequest request) {
        Center center = getEditableOwnedCenter(centerId, request.getManagerId());

        center.setName(request.getName());
        center.setDescription(request.getDescription());
        center.setPhoneNumber(request.getPhoneNumber());

        return centerRepository.save(center);
    }

    @Transactional
    public Center archiveCenter(Long centerId, Long managerId) {
        Center center = getCenterOwnedByManager(centerId, managerId);

        if (center.getArchivedAt() != null) {
            throw new RuntimeException("Center is already archived.");
        }

        if (hasActiveCourses(centerId)) {
            throw new RuntimeException("Cannot archive this center while it still has active courses.");
        }

        center.setArchivedAt(LocalDateTime.now());
        return centerRepository.save(center);
    }

    @Transactional
    public Center restoreCenter(Long centerId, Long managerId) {
        Center center = getCenterOwnedByManager(centerId, managerId);

        if (center.getArchivedAt() == null) {
            throw new RuntimeException("Center is not archived.");
        }

        center.setArchivedAt(null);
        return centerRepository.save(center);
    }

    private Center getCenterOwnedByManager(Long centerId, Long managerId) {
        Center center = centerRepository.findById(centerId)
                .orElseThrow(() -> new RuntimeException("Center not found with ID: " + centerId));

        if (!center.getManager().getId().equals(managerId)) {
            throw new RuntimeException("Only the center owner can manage this center.");
        }

        return center;
    }

    private Center getOwnedCenterForCurrentUser(Long centerId) {
        Center center = centerRepository.findById(centerId)
                .orElseThrow(() -> new RuntimeException("Center not found with ID: " + centerId));

        User currentUser = getCurrentUser();
        if (isAdmin(currentUser) || isCenterOwner(center, currentUser)) {
            return center;
        }

        throw new RuntimeException("Only the center owner can access this information.");
    }

    private Center getAccessibleCenterForCurrentUser(Long centerId) {
        Center center = centerRepository.findById(centerId)
                .orElseThrow(() -> new RuntimeException("Center not found with ID: " + centerId));

        User currentUser = getCurrentUser();
        if (isAdmin(currentUser) || isCenterOwner(center, currentUser)) {
            return center;
        }

        if (isTeacher(currentUser) && hasTeachingAccessToCenter(centerId, currentUser)) {
            return center;
        }

        throw new RuntimeException("You do not have permission to access this center.");
    }

    private boolean hasTeachingAccessToCenter(Long centerId, User user) {
        boolean linkedToCenter = user.getConnectedCenters().stream()
                .anyMatch(center -> center.getId().equals(centerId));
        boolean teachesInCenter = !courseRepository.findByCenterIdAndTeacherId(centerId, user.getId()).isEmpty();
        return linkedToCenter || teachesInCenter;
    }

    private boolean isCenterOwner(Center center, User user) {
        return center.getManager() != null && center.getManager().getId().equals(user.getId());
    }

    private boolean isTeacher(User user) {
        return user.getRole() != null && "TEACHER".equalsIgnoreCase(user.getRole().getName());
    }

    private boolean isAdmin(User user) {
        return user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName());
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Authentication is required.");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
    }

    private Center getEditableOwnedCenter(Long centerId, Long managerId) {
        Center center = getCenterOwnedByManager(centerId, managerId);
        ensureCenterNotArchived(center);
        return center;
    }

    private Center getEditableCenter(Long centerId) {
        Center center = centerRepository.findById(centerId)
                .orElseThrow(() -> new RuntimeException("Center not found with ID: " + centerId));
        ensureCenterNotArchived(center);
        return center;
    }

    private void ensureCenterNotArchived(Center center) {
        if (center.getArchivedAt() != null) {
            throw new RuntimeException("Archived centers cannot be edited. Restore the center first.");
        }
    }

    private boolean hasActiveCourses(Long centerId) {
        LocalDate today = LocalDate.now();

        return courseRepository.findByCenterId(centerId).stream()
                .anyMatch(course -> isCourseActive(course, today));
    }

    private boolean isCourseActive(Course course, LocalDate today) {
        if (course == null) {
            return false;
        }

        boolean activeStatus = course.getStatus() != CourseStatus.ENDED;
        boolean notFinished = course.getEndDate() == null || !course.getEndDate().isBefore(today);

        return activeStatus && notFinished;
    }

    public List<Classroom> getClassroomsByCenter(Long centerId) {
        getOwnedCenterForCurrentUser(centerId);
        return classroomRepository.findByCenterId(centerId);
    }

    @Transactional
    public Classroom createClassroom(Long centerId, ClassroomRequest request) {
        Center center = getEditableOwnedCenter(centerId, request.getManagerId());

        Classroom classroom = new Classroom();
        classroom.setSeat(request.getSeat());
        classroom.setLocation(request.getLocation());
        classroom.setLastMaintainDate(request.getLastMaintainDate());
        classroom.setCenter(center);

        return classroomRepository.save(classroom);
    }

    @Transactional
    public Classroom updateClassroom(Long centerId, Long classroomId, ClassroomRequest request) {
        getEditableOwnedCenter(centerId, request.getManagerId());

        Classroom classroom = classroomRepository.findByIdAndCenterId(classroomId, centerId)
                .orElseThrow(() -> new RuntimeException("Classroom not found in this center."));

        classroom.setSeat(request.getSeat());
        classroom.setLocation(request.getLocation());
        classroom.setLastMaintainDate(request.getLastMaintainDate());

        return classroomRepository.save(classroom);
    }

    @Transactional
    public void deleteClassroom(Long centerId, Long classroomId, Long managerId) {
        getEditableOwnedCenter(centerId, managerId);

        Classroom classroom = classroomRepository.findByIdAndCenterId(classroomId, centerId)
                .orElseThrow(() -> new RuntimeException("Classroom not found in this center."));

        if (classSlotRepository.existsByClassroomId(classroomId)) {
            throw new RuntimeException("Cannot delete this classroom because it is in-use.");
        }

        classroomRepository.delete(classroom);
    }

    public List<ClassSlot> getClassSlotsByCenter(Long centerId) {
        getOwnedCenterForCurrentUser(centerId);
        return classSlotRepository.findByCenterId(centerId);
    }

    public List<User> getTeachersByCenter(Long centerId) {
        getOwnedCenterForCurrentUser(centerId);
        return userRepository.findTeachersByCenterId(centerId);
    }

    public List<User> getVisibleStudentsByCenter(Long centerId) {
        Center center = getAccessibleCenterForCurrentUser(centerId);
        User currentUser = getCurrentUser();

        if (isAdmin(currentUser) || isCenterOwner(center, currentUser)) {
            return userRepository.findStudentsByCenterId(centerId);
        }

        if (isTeacher(currentUser) && hasTeachingAccessToCenter(centerId, currentUser)) {
            return enrollmentRepository.findStudentsByCenterIdAndTeacherId(centerId, currentUser.getId());
        }

        throw new RuntimeException("You do not have permission to view students in this center.");
    }

    @Transactional
    public User inviteTeacherToCenter(Long centerId, Long managerId, String email) {
        Center center = getEditableOwnedCenter(centerId, managerId);

        User teacher = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Teacher not found."));

        if (!"TEACHER".equalsIgnoreCase(teacher.getRole().getName())) {
            throw new RuntimeException("This user is not registered as a Teacher.");
        }

        boolean alreadyLinked = teacher.getConnectedCenters().stream()
                .anyMatch(c -> c.getId().equals(centerId));

        if (alreadyLinked) {
            throw new RuntimeException("Teacher is already linked to this center.");
        }

        teacher.getConnectedCenters().add(center);
        return userRepository.save(teacher);
    }

    @Transactional
    public void unlinkTeacherFromCenter(Long centerId, Long teacherId, Long managerId) {
        Center center = getEditableOwnedCenter(centerId, managerId);

        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found."));

        if (!"TEACHER".equalsIgnoreCase(teacher.getRole().getName())) {
            throw new RuntimeException("Selected user is not a teacher.");
        }

        if (center.getManager().getId().equals(teacherId)) {
            throw new RuntimeException("Cannot unlink the center manager.");
        }

        boolean removed = teacher.getConnectedCenters().removeIf(c -> c.getId().equals(centerId));
        if (!removed) {
            throw new RuntimeException("Teacher is not linked to this center.");
        }

        // Reassign this teacher's courses in this center to the center manager.
        List<Course> teacherCourses = courseRepository.findByCenterIdAndTeacherId(centerId, teacherId);
        for (Course course : teacherCourses) {
            course.setTeacher(center.getManager());
            course.setPendingTeacher(null);
            course.setInvitationStatus("ACCEPTED");
        }
        courseRepository.saveAll(teacherCourses);

        userRepository.save(teacher);
    }

    @Transactional
    public ClassSlot createClassSlot(Long centerId, ClassSlotRequest request) {
        Center center = getEditableOwnedCenter(centerId, request.getManagerId());

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found."));

        if (!course.getCenter().getId().equals(centerId)) {
            throw new RuntimeException("Course does not belong to this center.");
        }

        Classroom classroom = classroomRepository.findByIdAndCenterId(request.getClassroomId(), centerId)
                .orElseThrow(() -> new RuntimeException("Classroom not found in this center."));

        validateSlotTimes(request.getStartTime(), request.getEndTime());
        validateNoTimeConflicts(
                centerId,
                request.getCourseId(),
                request.getClassroomId(),
                course.getStartDate(),
                course.getEndDate(),
                request.getStartTime(),
                request.getEndTime(),
                request.getDaysOfWeek(),
                null);

        ClassSlot slot = new ClassSlot();
        slot.setCenter(center);
        slot.setCourse(course);
        slot.setClassroom(classroom);
        slot.setStartDate(course.getStartDate());
        slot.setEndDate(course.getEndDate());
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setDaysOfWeek(request.getDaysOfWeek());
        slot.setIsRecurring(Boolean.TRUE.equals(request.getRecurring()) || request.getRecurring() == null);

        ClassSlot saved = classSlotRepository.save(slot);

        courseService.synchronizeSessionsFromActiveClassSlots(course);

        return saved;
    }

    @Transactional
    public ClassSlot updateClassSlot(Long centerId, Long slotId, ClassSlotRequest request) {
        getEditableOwnedCenter(centerId, request.getManagerId());

        ClassSlot slot = classSlotRepository.findByIdAndCenterId(slotId, centerId)
                .orElseThrow(() -> new RuntimeException("ClassSlot not found in this center."));

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found."));

        if (!course.getCenter().getId().equals(centerId)) {
            throw new RuntimeException("Course does not belong to this center.");
        }

        Classroom classroom = classroomRepository.findByIdAndCenterId(request.getClassroomId(), centerId)
                .orElseThrow(() -> new RuntimeException("Classroom not found in this center."));

        validateSlotTimes(request.getStartTime(), request.getEndTime());
        validateNoTimeConflicts(
                centerId,
                request.getCourseId(),
                request.getClassroomId(),
                course.getStartDate(),
                course.getEndDate(),
                request.getStartTime(),
                request.getEndTime(),
                request.getDaysOfWeek(),
                slotId);

        slot.setCourse(course);
        slot.setClassroom(classroom);
        slot.setStartDate(course.getStartDate());
        slot.setEndDate(course.getEndDate());
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setDaysOfWeek(request.getDaysOfWeek());
        slot.setIsRecurring(Boolean.TRUE.equals(request.getRecurring()) || request.getRecurring() == null);

        ClassSlot saved = classSlotRepository.save(slot);

        courseService.synchronizeSessionsFromActiveClassSlots(course);

        return saved;
    }

    @Transactional
    public void deleteClassSlot(Long centerId, Long slotId, Long managerId) {
        getEditableOwnedCenter(centerId, managerId);
        ClassSlot slot = classSlotRepository.findByIdAndCenterId(slotId, centerId)
                .orElseThrow(() -> new RuntimeException("ClassSlot not found in this center."));
        attendanceRepository.deleteByClassSlotId(slotId);     
        classSlotRepository.delete(slot);

    }

    @Transactional
    public void deleteClassSlotOccurrence(Long centerId, Long slotId, LocalDate date, Long managerId) {
        getEditableOwnedCenter(centerId, managerId);

        ClassSlot slot = classSlotRepository.findByIdAndCenterId(slotId, centerId)
                .orElseThrow(() -> new RuntimeException("ClassSlot not found in this center."));

        if (!isDateWithinRange(date, slot.getStartDate(), slot.getEndDate())) {
            throw new RuntimeException("Selected date is outside the class slot date range.");
        }

        if (!isSlotScheduledOnDate(slot, date)) {
            throw new RuntimeException("This class slot does not run on the selected date.");
        }

        if (slot.getExcludedDates() == null) {
            slot.setExcludedDates(new HashSet<>());
        }

        slot.getExcludedDates().add(date);
        classSlotRepository.save(slot);
    }

    @Transactional
    public ClassSlot overrideClassSlotOccurrence(
            Long centerId,
            Long slotId,
            LocalDate date,
            ClassSlotOccurrenceOverrideRequest request) {

        getEditableOwnedCenter(centerId, request.getManagerId());

        ClassSlot slot = classSlotRepository.findByIdAndCenterId(slotId, centerId)
                .orElseThrow(() -> new RuntimeException("ClassSlot not found in this center."));

        if (!isDateWithinRange(date, slot.getStartDate(), slot.getEndDate())) {
            throw new RuntimeException("Selected date is outside the class slot date range.");
        }

        if (!isSlotScheduledOnDate(slot, date)) {
            throw new RuntimeException("This class slot does not run on the selected date.");
        }

        validateSlotTimes(request.getStartTime(), request.getEndTime());

        Classroom overrideClassroom = classroomRepository.findByIdAndCenterId(request.getClassroomId(), centerId)
                .orElseThrow(() -> new RuntimeException("Classroom not found in this center."));

        Set<DayOfWeek> singleDay = new HashSet<>();
        singleDay.add(date.getDayOfWeek());

        validateNoTimeConflicts(
                centerId,
                slot.getCourse() != null ? slot.getCourse().getId() : null,
                request.getClassroomId(),
                date,
                date,
                request.getStartTime(),
                request.getEndTime(),
                singleDay,
                slotId);

        if (slot.getExcludedDates() == null) {
            slot.setExcludedDates(new HashSet<>());
        }
        slot.getExcludedDates().add(date);
        classSlotRepository.save(slot);

        ClassSlot overrideSlot = new ClassSlot();
        overrideSlot.setCenter(slot.getCenter());
        overrideSlot.setCourse(slot.getCourse());
        overrideSlot.setClassroom(overrideClassroom);
        overrideSlot.setStartDate(date);
        overrideSlot.setEndDate(date);
        overrideSlot.setStartTime(request.getStartTime());
        overrideSlot.setEndTime(request.getEndTime());
        overrideSlot.setDaysOfWeek(singleDay);
        overrideSlot.setIsRecurring(false);

        return classSlotRepository.save(overrideSlot);
    }

    private void validateSlotTimes(LocalTime startTime, LocalTime endTime) {
        if (startTime == null || endTime == null) {
            throw new RuntimeException("Start time and end time are required.");
        }

        if (!(startTime.getMinute() == 0 || startTime.getMinute() == 30)
                || !(endTime.getMinute() == 0 || endTime.getMinute() == 30)) {
            throw new RuntimeException("Time must be on 30-minute boundaries (:00 or :30).");
        }

        if (!endTime.isAfter(startTime)) {
            throw new RuntimeException("End time must be after start time.");
        }
    }

    private void validateNoTimeConflicts(
            Long centerId,
            Long requestCourseId,
            Long requestClassroomId,
            LocalDate requestStartDate,
            LocalDate requestEndDate,
            LocalTime requestStartTime,
            LocalTime requestEndTime,
            Set<DayOfWeek> requestDays,
            Long excludeSlotId) {

        List<ClassSlot> existingSlots = classSlotRepository.findByCenterId(centerId);

        for (ClassSlot existing : existingSlots) {
            if (excludeSlotId != null && excludeSlotId.equals(existing.getId())) {
                continue;
            }

            if (!dateRangesOverlap(requestStartDate, requestEndDate, existing.getStartDate(), existing.getEndDate())) {
                continue;
            }

            if (!daySetsOverlap(requestDays, getEffectiveDays(existing))) {
                continue;
            }

            if (!timeRangesOverlap(requestStartTime, requestEndTime, existing.getStartTime(), existing.getEndTime())) {
                continue;
            }

            Long existingCourseId = existing.getCourse() != null ? existing.getCourse().getId() : null;
            Long existingClassroomId = existing.getClassroom() != null ? existing.getClassroom().getId() : null;

            if (requestCourseId != null && requestCourseId.equals(existingCourseId)) {
                throw new RuntimeException("This course already has another class slot at the same time.");
            }

            if (requestClassroomId != null && requestClassroomId.equals(existingClassroomId)) {
                throw new RuntimeException("This classroom is already occupied at the selected time.");
            }
        }
    }

    private boolean timeRangesOverlap(LocalTime startA, LocalTime endA, LocalTime startB, LocalTime endB) {
        return startA.isBefore(endB) && startB.isBefore(endA);
    }

    private boolean dateRangesOverlap(LocalDate startA, LocalDate endA, LocalDate startB, LocalDate endB) {
        return !endA.isBefore(startB) && !endB.isBefore(startA);
    }

    private boolean daySetsOverlap(Set<DayOfWeek> daysA, Set<DayOfWeek> daysB) {
        if (daysA == null || daysA.isEmpty() || daysB == null || daysB.isEmpty()) {
            return false;
        }

        for (DayOfWeek day : daysA) {
            if (daysB.contains(day)) {
                return true;
            }
        }
        return false;
    }

    private boolean isDateWithinRange(LocalDate date, LocalDate startDate, LocalDate endDate) {
        return date != null && startDate != null && endDate != null
                && !date.isBefore(startDate) && !date.isAfter(endDate);
    }

    private boolean isSlotScheduledOnDate(ClassSlot slot, LocalDate date) {
        Set<DayOfWeek> days = getEffectiveDays(slot);
        if (!days.contains(date.getDayOfWeek())) {
            return false;
        }

        Set<LocalDate> excludedDates = slot.getExcludedDates();
        return excludedDates == null || !excludedDates.contains(date);
    }

    private Set<DayOfWeek> getEffectiveDays(ClassSlot slot) {
        Set<DayOfWeek> effectiveDays = new HashSet<>();

        if (slot.getDaysOfWeek() != null) {
            effectiveDays.addAll(slot.getDaysOfWeek());
        }

        if (slot.getDayOfWeek() != null) {
            effectiveDays.add(slot.getDayOfWeek());
        }

        return effectiveDays;
    }
}