import api from '../utils/axiosConfig';
import type { CourseStatus } from '@/utils/courseStatus';

// Định nghĩa kiểu dữ liệu Course (khớp với Java)
export interface CourseSubject {
    id: number;
    name: string;
    description?: string;
}

export interface CourseGrade {
    id: number;
    name: string;
    description?: string;
    fromAge?: number;
    toAge?: number;
}

export interface Course {
    id: number;
    name: string;
    subject?: CourseSubject;
    grade?: CourseGrade;
    description: string;
    status: CourseStatus;
    startDate: string;
    endDate: string;
    center: {
        id?: number;
        name: string;
        manager?: {
            id?: number;
            firstName?: string;
            lastName?: string;
        };
    };
    teacher: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    };
    invitationStatus: string; // PENDING, ACCEPTED
    tuitionFeeVnd?: number;
    archivedAt?: string | null;
}

export interface CourseUpsertData {
    name: string;
    subjectId?: number;
    gradeId?: number;
    description: string;
    startDate: string;
    endDate: string;
    centerId: number;
    teacherId: number;
    slots?: any[];
}

// Hàm gọi API lấy danh sách
export const getTeacherCourses = async (teacherId: number) => {
    const response = await api.get<Course[]>(`/courses/teacher/${teacherId}`);
    return response.data;
};

export const getCoursesByCenter = async (centerId: number) => {
    const response = await api.get<Course[]>(`/courses?centerId=${centerId}`);
    // Lưu ý: Bạn cần check lại Backend xem có API filter theo centerId chưa.
    // Nếu chưa, ta dùng tạm API getTeacherCourses rồi filter phía client cũng được (cho nhanh).
    return response.data;
};

// API Tạo
export const createCourse = async (data: CourseUpsertData) => {
    console.log("Creating course with data:", data);
    const rawToken = JSON.parse(localStorage.getItem('loginResponse') || '{}').token;
    console.log("🔍 SỰ THẬT BÊN TRONG TOKEN:", rawToken ? JSON.parse(atob(rawToken.split('.')[1])) : "Chưa có token");
    const response = await api.post('/courses', data);
    return response.data;
};

// API Xóa
export const deleteCourse = async (id: number) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
};

export const requestDeleteCourseOtp = async (courseId: number, managerId: number) => {
    const response = await api.post(`/courses/${courseId}/delete-otp?managerId=${managerId}`);
    return response.data;
};

export const confirmDeleteCourseWithOtp = async (courseId: number, managerId: number, otp: string) => {
    const response = await api.delete(`/courses/${courseId}/confirm-delete?managerId=${managerId}&otp=${encodeURIComponent(otp)}`);
    return response.data;
};

// Lấy chi tiết 1 khóa
export const getCourseById = async (id: number) => {
    const res = await api.get(`/courses/${id}`);
    return res.data;
}

// Cập nhật khóa học
export const updateCourse = async (id: number, data: CourseUpsertData) => {
    const res = await api.put(`/courses/${id}`, data);
    return res.data;
}

export const endCourseEarly = async (id: number) => {
    const response = await api.put<Course>(`/courses/${id}/end-early`);
    return response.data;
};

export const reopenCourse = async (id: number, data: CourseUpsertData) => {
    const response = await api.put<Course>(`/courses/${id}/reopen`, data);
    return response.data;
};

// Hàm mời
export const inviteTeacher = async (courseId: number, email: string) => {
    await api.post(`/courses/${courseId}/invite?email=${email}`);
};

export const assignTeacherToCourse = async (courseId: number, teacherId: number, managerId: number) => {
    const response = await api.put(`/courses/${courseId}/teacher?teacherId=${teacherId}&managerId=${managerId}`);
    return response.data;
};

// Hàm phản hồi
export const respondInvitation = async (courseId: number, status: "ACCEPTED" | "REJECTED") => {
    await api.post(`/courses/${courseId}/respond?status=${status}`);
};

// Hàm lấy lời mời
export const getInvitations = async (teacherId: number) => {
    const res = await api.get(`/courses/invitations/${teacherId}`);
    return res.data;
};

// Get students in a course
export const getStudentsInCourse = async (courseId: number) => {
    const response = await api.get(`/courses/${courseId}/students`);
    return response.data;
};

// Add student
export const addStudentToCourse = async (courseId: number, studentId: number) => {
    const response = await api.post(`/courses/${courseId}/students/${studentId}`);
    return response.data;
};

// Remove student
export const removeStudentFromCourse = async (courseId: number, studentId: number) => {
    const response = await api.delete(`/courses/${courseId}/students/${studentId}`);
    return response.data;
};

// Search Students (Reusing your User Search logic)
export const searchStudents = async (keyword: string) => {
    const response = await api.get(`/users/search?keyword=${keyword}`);
    return response.data;
};

// 1. Lấy danh sách khóa học mà học sinh đang học
export const getStudentCourses = async (studentId: number) => {
    const response = await api.get<Course[]>(`/courses/student/${studentId}`);
    return response.data;
};

// 2. Lấy danh sách bài tập chưa nộp (Pending Assignments)
export const getStudentPendingAssignments = async (studentId: number) => {
    const response = await api.get(`/assignments/student/${studentId}/pending`);
    return response.data;
};

// 3. Lấy danh sách lịch học sắp tới (Upcoming Classes)
export const getStudentUpcomingClasses = async (studentId: number) => {
    const response = await api.get(`/class-sessions/student/${studentId}/upcoming`);
    return response.data;
};

export const getArchivedCoursesByCenter = async (centerId: number) => {
    const response = await api.get<Course[]>(`/courses/archived?centerId=${centerId}`);
    return response.data;
};

export const restoreCourse = async (courseId: number) => {
    const response = await api.put<Course>(`/courses/${courseId}/restore`);
    return response.data;
};
