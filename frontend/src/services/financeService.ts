import api from "@/utils/axiosConfig";

export type FinanceType = "INCOME" | "EXPENSE";
export type PaymentPlanType = "FULL_COURSE" | "MONTHLY" | "SESSION_PACKAGE" | "CUSTOM_PLAN";
export type TuitionStatus = "PAID" | "PARTIAL" | "UNPAID" | "OVERDUE" | "CANCELLED";
export type InstallmentStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";

export interface FinanceRecordRequest {
    name: string;
    type: FinanceType;
    amountVnd: number;
    description?: string;
    date: string;
}

export interface FinanceRecord extends FinanceRecordRequest {
    id: number;
    createdAt?: string;
}

export interface FinanceReport {
    totalIncomeVnd: number;
    totalExpenseVnd: number;
    profitVnd: number;
    records?: FinanceRecord[];
}

export interface TuitionInstallment {
    id: number;
    installmentNumber: number;
    dueDate: string;
    amountDueVnd: number;
    amountPaidVnd: number;
    remainingVnd: number;
    status: InstallmentStatus;
    enrollmentId?: number;
    studentName?: string;
    courseName?: string;
}

export interface StudentTuition {
    enrollmentId: number;
    tuitionAccountId?: number;
    courseId: number;
    courseName: string;
    paymentPlanType: PaymentPlanType;
    planStartDate?: string;
    planEndDate?: string;
    totalSessions?: number;
    purchasedSessions?: number;
    tuitionFeeVnd: number;
    scholarshipDiscountPercentage: number;
    scholarshipDiscountVnd: number;
    finalTuitionVnd: number;
    totalPaidVnd: number;
    remainingVnd: number;
    tuitionStatus: TuitionStatus;
    installments: TuitionInstallment[];
    paymentHistory: Array<{
        paidAt: string;
        amountVnd: number;
        note?: string;
        recordedByUserId?: number;
    }>;
}

export interface TuitionAccountRequest {
    enrollmentId: number;
    paymentPlanType: PaymentPlanType;
    startDate?: string;
    endDate?: string;
    totalSessions?: number;
    purchasedSessions?: number;
    monthlyAmountVnd?: number;
    installments?: Array<{
        dueDate: string;
        amountDueVnd: number;
    }>;
}

export interface TuitionPaymentRequest {
    enrollmentId: number;
    amountVnd: number;
    paidAt: string;
    note?: string;
    installmentId?: number;
}

export interface CenterFinanceDashboard {
    monthlyRevenueVnd: number;
    monthlyExpenseVnd: number;
    estimatedProfitVnd: number;
    outstandingDebtVnd: number;
    overduePaymentCount: number;
    overduePayments: TuitionInstallment[];
}

export const formatVnd = (value?: number | null) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value || 0);

export const getMonthRange = (date = new Date()) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const toIsoDate = (value: Date) => value.toISOString().slice(0, 10);
    return {
        start: toIsoDate(start),
        end: toIsoDate(end),
        date: toIsoDate(start),
        monthInput: `${year}-${String(month + 1).padStart(2, "0")}`,
    };
};

export const monthInputToDate = (monthInput: string) => `${monthInput}-01`;

export const getTeacherFinanceRecords = async (start: string, end: string) => {
    const response = await api.get<FinanceRecord[]>(`/teacher/finance/records?start=${start}&end=${end}`);
    return response.data;
};

export const getTeacherFinanceMonthlyReport = async (date: string) => {
    const response = await api.get<FinanceReport>(`/teacher/finance/reports/monthly?date=${date}`);
    return response.data;
};

export const createTeacherFinanceRecord = async (data: FinanceRecordRequest) => {
    const response = await api.post<FinanceRecord>("/teacher/finance/records", data);
    return response.data;
};

export const deleteTeacherFinanceRecord = async (recordId: number) => {
    const response = await api.delete(`/teacher/finance/records/${recordId}`);
    return response.data;
};

export const getCenterFinanceRecords = async (centerId: number, start: string, end: string) => {
    const response = await api.get<FinanceRecord[]>(`/centers/finance/records?centerId=${centerId}&start=${start}&end=${end}`);
    return response.data;
};

export const getCenterFinanceDashboard = async (centerId: number, date: string) => {
    const response = await api.get<CenterFinanceDashboard>(`/centers/finance/dashboard?centerId=${centerId}&date=${date}`);
    return response.data;
};

export const createCenterFinanceRecord = async (centerId: number, data: FinanceRecordRequest) => {
    const response = await api.post<FinanceRecord>(`/centers/finance/records?centerId=${centerId}`, data);
    return response.data;
};

export const deleteCenterFinanceRecord = async (recordId: number) => {
    const response = await api.delete(`/centers/finance/records/${recordId}`);
    return response.data;
};

export const getCourseFinanceRecords = async (courseId: number, start: string, end: string) => {
    const response = await api.get<FinanceRecord[]>(`/courses/finance/records?courseId=${courseId}&start=${start}&end=${end}`);
    return response.data;
};

export const getCourseFinanceMonthlyReport = async (courseId: number, date: string) => {
    const response = await api.get<FinanceReport>(`/courses/finance/reports/monthly?courseId=${courseId}&date=${date}`);
    return response.data;
};

export const createCourseFinanceRecord = async (courseId: number, data: FinanceRecordRequest) => {
    const response = await api.post<FinanceRecord>(`/courses/finance/records?courseId=${courseId}`, data);
    return response.data;
};

export const deleteCourseFinanceRecord = async (recordId: number) => {
    const response = await api.delete(`/courses/finance/records/${recordId}`);
    return response.data;
};

export const getMyTuition = async () => {
    const response = await api.get<StudentTuition[]>("/tuition/student/me");
    return response.data;
};

export const getStudentTuition = async (studentId: number) => {
    const response = await api.get<StudentTuition[]>(`/tuition/student/${studentId}`);
    return response.data;
};

export const saveTuitionAccount = async (data: TuitionAccountRequest) => {
    const response = await api.post("/tuition/accounts", data);
    return response.data;
};

export const createTuitionPayment = async (data: TuitionPaymentRequest) => {
    const response = await api.post("/tuition/payments", data);
    return response.data;
};
