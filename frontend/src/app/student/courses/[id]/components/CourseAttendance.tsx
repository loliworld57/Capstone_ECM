"use client";

import { useEffect, useState, useMemo } from "react";
import {
    BrainCircuit,
    Loader2,
    Calendar,
    CheckCircle,
    XCircle,
    AlertCircle,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
    Percent,
    UserCheck,
    Clock,
    UserX,
    FileText,
    MapPin
} from "lucide-react";
import toast from "react-hot-toast";
import api from '@/utils/axiosConfig';
import { formatDateValue } from "@/utils/dateFormat";

interface Props {
    courseId: number;
}

interface StudentAttendanceRecord {
    sessionId: number;
    date: string;
    startTime: string;
    endTime: string;
    classroomLocation: string | null;
    status: "ATTEND" | "ABSENT" | "LATE" | "EXCUSE" | "NOT_TAKEN";
}

export default function CourseAttendance({ courseId }: Props) {
    const [records, setRecords] = useState<StudentAttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- PAGINATION STATES ---
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const fetchStudentAttendance = async () => {
        setIsLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            if (!user.id) {
                toast.error("User session expired. Please log in again.");
                return;
            }

            const response = await api.get(`/attendance/course/${courseId}/student/${user.id}`);
            setRecords(response.data || []);
            setCurrentPage(1); 
        } catch (error: any) {
            console.error("Error loading student attendance logs:", error);
            toast.error(error?.response?.data?.error || "Cannot load your attendance logs.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) fetchStudentAttendance();
    }, [courseId]);

    // --- REAL-TIME STATS CALCULATIONS ---
    const stats = useMemo(() => {
        const total = records.filter(r => r.status !== "NOT_TAKEN").length;
        if (total === 0) return { attend: 0, absent: 0, late: 0, excuse: 0, rate: 100 };

        const attend = records.filter(r => r.status === "ATTEND").length;
        const absent = records.filter(r => r.status === "ABSENT").length;
        const late = records.filter(r => r.status === "LATE").length;
        const excuse = records.filter(r => r.status === "EXCUSE").length;
        const rate = Math.round(((attend + late) / total) * 100);

        return { attend, absent, late, excuse, rate };
    }, [records]);

    // --- PAGINATION LOGIC CALCULATIONS ---
    const totalPages = Math.ceil(records.length / rowsPerPage) || 1;

    const paginatedRecords = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return records.slice(startIndex, endIndex);
    }, [records, currentPage]);

    const renderStatusBadge = (status: StudentAttendanceRecord["status"]) => {
        switch (status) {
            case "ATTEND":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-[var(--color-main)] border border-green-200 shadow-xs">
                        <CheckCircle size={13} /> Present
                    </span>
                );
            case "ABSENT":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-xs">
                        <XCircle size={13} /> Absent
                    </span>
                );
            case "LATE":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
                        <AlertCircle size={13} /> Late
                    </span>
                );
            case "EXCUSE":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
                        <HelpCircle size={13} /> Excused
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200/60 italic">
                        No record
                    </span>
                );
        }
    };

    if (isLoading) {
        return (
            <div className="p-16 text-center text-gray-500 bg-white rounded-xl border border-gray-100 shadow-xs">
                <Loader2 size={28} className="animate-spin text-[var(--color-main)] mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-400">Syncing your academic attendance records...</p>
            </div>
        );
    }

    const isGoodRate = stats.rate >= 80;

    return (
        <div className="space-y-6">

            {/* TOP STATS DASHBOARD HERO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* 1. Overall Ratio Metrics */}
                <div className={`border p-4 rounded-xl shadow-xs flex items-center justify-between transition-colors ${
                    isGoodRate ? "bg-white border-gray-200" : "bg-red-50/30 border-red-100"
                }`}>
                    <div className="space-y-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Rate</span>
                        <span className={`block text-2xl font-black leading-none ${isGoodRate ? "text-gray-800" : "text-red-600"}`}>
                            {stats.rate}%
                        </span>
                    </div>
                    <div className={`p-2 rounded-xl border ${
                        isGoodRate ? "bg-gray-50 text-[var(--color-main)] border-gray-100" : "bg-red-50 text-red-500 border-red-100"
                    }`}>
                        <Percent size={18} />
                    </div>
                </div>

                {/* 2. Total Presents */}
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs flex items-center justify-between">
                    <div className="space-y-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-main)]">Present</span>
                        <span className="block text-2xl font-black text-[var(--color-text)] leading-none">{stats.attend}</span>
                    </div>
                    <div className="p-2 bg-green-50 text-[var(--color-main)] border border-green-100 rounded-xl">
                        <UserCheck size={18} />
                    </div>
                </div>

                {/* 3. Total Lates */}
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs flex items-center justify-between">
                    <div className="space-y-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Late</span>
                        <span className="block text-2xl font-black text-[var(--color-text)] leading-none">{stats.late}</span>
                    </div>
                    <div className="p-2 bg-amber-50 text-amber-500 border border-amber-100 rounded-xl">
                        <Clock size={18} />
                    </div>
                </div>

                {/* 4. Total Absents */}
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs flex items-center justify-between">
                    <div className="space-y-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-red-500">Absent</span>
                        <span className="block text-2xl font-black text-[var(--color-text)] leading-none">{stats.absent}</span>
                    </div>
                    <div className="p-2 bg-red-50 text-red-600 border border-red-100 rounded-xl">
                        <UserX size={18} />
                    </div>
                </div>

                {/* 5. Total Excuses */}
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs flex items-center justify-between">
                    <div className="space-y-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Excused</span>
                        <span className="block text-2xl font-black text-[var(--color-text)] leading-none">{stats.excuse}</span>
                    </div>
                    <div className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl">
                        <FileText size={18} />
                    </div>
                </div>
            </div>

            {/* ATTENDANCE LOGS HISTORY TABLE */}
            <div className="bg-white rounded-xl border border-[var(--color-main)]/20 shadow-sm overflow-hidden">
                
                {/* TABLE HEADER */}
                <div className="bg-[var(--color-main)] text-white px-6 py-4 flex items-center justify-between font-semibold">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-white/10 rounded-lg">
                            <BrainCircuit size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold leading-none">Detailed Attendance History</h3>
                            <p className="text-[11px] text-white/70 font-normal mt-1">Review live structural session analytics across terms</p>
                        </div>
                    </div>
                    <span className="bg-white/20 text-xs px-2.5 py-1 rounded-full font-bold">
                        {records.length} Sessions
                    </span>
                </div>

                {/* DATA TABLE WRAPPER */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse bg-white">
                        <thead>
                            <tr className="bg-[var(--color-secondary)]/10 text-[var(--color-text)] border-b border-gray-100">
                                <th className="p-4 w-14 text-center font-bold tracking-wide uppercase text-[11px] text-gray-500">#</th>
                                <th className="p-4 font-bold tracking-wide uppercase text-[11px] text-gray-500">Session Date</th>
                                <th className="p-4 w-48 font-bold tracking-wide uppercase text-[11px] text-gray-500">Class Time</th>
                                <th className="p-4 w-52 font-bold tracking-wide uppercase text-[11px] text-gray-500">Location</th>
                                <th className="p-4 w-40 text-center font-bold tracking-wide uppercase text-[11px] text-gray-500">Your Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-gray-400 py-16 font-medium text-sm">
                                        No session attendance records found for this course tracking branch.
                                    </td>
                                </tr>
                            ) : (
                                paginatedRecords.map((record, index) => {
                                    const globalIndex = (currentPage - 1) * rowsPerPage + index + 1;
                                    const isAbsent = record.status === "ABSENT";

                                    return (
                                        <tr 
                                            key={record.sessionId} 
                                            className={`hover:bg-gray-50/80 transition-colors group ${
                                                isAbsent ? "bg-red-50/15 hover:bg-red-50/25" : ""
                                            }`}
                                        >
                                            <td className="p-4 text-center text-gray-400 font-mono text-xs font-semibold">
                                                {String(globalIndex).padStart(2, '0')}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 font-semibold text-gray-800 text-sm group-hover:text-[var(--color-main)] transition-colors">
                                                    <Calendar size={14} className="text-gray-400 group-hover:text-[var(--color-main)] transition-colors" />
                                                    {formatDateValue(record.date)}
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-600 font-medium text-xs whitespace-nowrap">
                                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md border border-gray-200/30">
                                                    {record.startTime?.slice(0, 5)} - {record.endTime?.slice(0, 5)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500 font-medium text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin size={13} className="text-gray-400 shrink-0" />
                                                    <span className="truncate max-w-[180px]">
                                                        {record.classroomLocation || "Online / Virtual Group"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center whitespace-nowrap">
                                                {renderStatusBadge(record.status)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- FOOTER PAGINATION NAVIGATION BAR --- */}
                {records.length > rowsPerPage && (
                    <div className="bg-gray-50 p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs font-medium text-gray-500">
                            Showing page <span className="font-bold text-gray-700">{currentPage}</span> of <span className="font-bold text-gray-700">{totalPages}</span> ({records.length} items logged)
                        </p>

                        <div className="inline-flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="inline-flex items-center justify-center p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                            >
                                <ChevronLeft size={15} />
                            </button>

                            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all border ${
                                        page === currentPage
                                            ? "bg-[var(--color-main)] border-[var(--color-main)] text-white shadow-xs"
                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                type="button"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="inline-flex items-center justify-center p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}