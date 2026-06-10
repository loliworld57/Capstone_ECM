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
    ChevronRight
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
            setCurrentPage(1); // Reset back to page 1 whenever new data loads
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

    // Slice the records array to isolate only the 10 slots for the current page view
    const paginatedRecords = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return records.slice(startIndex, endIndex);
    }, [records, currentPage]);

    const renderStatusBadge = (status: StudentAttendanceRecord["status"]) => {
        switch (status) {
            case "ATTEND":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle size={12} /> Present
                    </span>
                );
            case "ABSENT":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                        <XCircle size={12} /> Absent
                    </span>
                );
            case "LATE":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
                        <AlertCircle size={12} /> Late
                    </span>
                );
            case "EXCUSE":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <HelpCircle size={12} /> Excused
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 italic">
                        No record
                    </span>
                );
        }
    };

    if (isLoading) {
        return (
            <div className="p-12 text-center text-gray-500">
                <Loader2 size={24} className="animate-spin text-[var(--color-main)] mx-auto mb-2" />
                <p>Syncing your academic attendance records...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* TOP STATS DASHBOARD HERO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white border p-4 rounded-xl shadow-xs text-center flex flex-col justify-center">
                    <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">Attendance Rate</span>
                    <span className={`text-2xl font-extrabold mt-1 ${stats.rate >= 80 ? "text-green-600" : "text-red-600"}`}>
                        {stats.rate}%
                    </span>
                </div>
                <div className="bg-green-50/50 border border-green-100 p-4 rounded-xl text-center">
                    <span className="text-xs font-bold uppercase text-green-700 tracking-wider">Present</span>
                    <span className="block text-2xl font-extrabold text-green-900 mt-1">{stats.attend}</span>
                </div>
                <div className="bg-yellow-50/50 border border-yellow-100 p-4 rounded-xl text-center">
                    <span className="text-xs font-bold uppercase text-yellow-700 tracking-wider">Late</span>
                    <span className="block text-2xl font-extrabold text-yellow-900 mt-1">{stats.late}</span>
                </div>
                <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl text-center">
                    <span className="text-xs font-bold uppercase text-red-700 tracking-wider">Absent</span>
                    <span className="block text-2xl font-extrabold text-red-900 mt-1">{stats.absent}</span>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-center">
                    <span className="text-xs font-bold uppercase text-blue-700 tracking-wider">Excused</span>
                    <span className="block text-2xl font-extrabold text-blue-900 mt-1">{stats.excuse}</span>
                </div>
            </div>

            {/* ATTENDANCE LOGS HISTORY TABLE */}
            <div className="bg-white rounded-xl border border-[var(--color-main)] shadow-xs overflow-hidden">
                <div className="bg-[var(--color-main)] text-white px-6 py-3.5 flex items-center gap-2 font-semibold text-sm">
                    <BrainCircuit size={16} />
                    Your Detailed Attendance History ({records.length} Sessions)
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs uppercase tracking-wider font-bold">
                                <th className="p-4 w-12 text-center">#</th>
                                <th className="p-4">Session Date</th>
                                <th className="p-4 w-48">Class Time</th>
                                <th className="p-4 w-48">Location</th>
                                <th className="p-4 w-40 text-center">Your Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-gray-500 py-10 italic">
                                        No session attendance records found for this course tracking branch.
                                    </td>
                                </tr>
                            ) : (
                                paginatedRecords.map((record, index) => {
                                    // Calculate chronological sequence number across pages
                                    const globalIndex = (currentPage - 1) * rowsPerPage + index + 1;

                                    return (
                                        <tr key={record.sessionId} className="border-b last:border-0 hover:bg-gray-50/70 transition">
                                            <td className="p-4 text-center text-gray-400 font-mono text-xs">{globalIndex}</td>
                                            <td className="p-4 font-semibold text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-[var(--color-main)]" />
                                                    {formatDateValue(record.date)}
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-600 font-medium whitespace-nowrap">
                                                {record.startTime?.slice(0, 5)} - {record.endTime?.slice(0, 5)}
                                            </td>
                                            <td className="p-4 text-gray-500 font-medium">
                                                {record.classroomLocation || "Online / Virtual Group"}
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
                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between text-xs font-medium text-gray-600">
                        <div>
                            Showing <span className="font-bold">{(currentPage - 1) * rowsPerPage + 1}</span> to{" "}
                            <span className="font-bold">
                                {Math.min(currentPage * rowsPerPage, records.length)}
                            </span>{" "}
                            of <span className="font-bold">{records.length}</span> entries
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-md border bg-white text-gray-500 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <div className="px-3 py-1 bg-white border rounded-md font-bold text-gray-800 shadow-3xs">
                                Page {currentPage} of {totalPages}
                            </div>

                            <button
                                type="button"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-md border bg-white text-gray-500 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}