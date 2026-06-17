"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { BookOpen, CalendarDays, Clock3, MapPin, ArrowUpRight, User, ChevronLeft, ChevronRight, CheckCircle2, Radio } from "lucide-react";
import toast from "react-hot-toast";
import { getStudentCourses } from "@/services/courseService";
import api from "@/utils/axiosConfig";
import { formatDateValue } from "@/utils/dateFormat";
import Link from "next/link";

type UpcomingSession = {
    sessionId?: number;
    courseId?: number;
    courseName?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    roomName?: string;
    status?: string;
};

export default function StudentDashboard() {
    const [loading, setLoading] = useState(true);
    const [totalCourses, setTotalCourses] = useState(0);
    const [studentUpcomingClasses, setStudentUpcomingClasses] = useState<UpcomingSession[]>([]);

    // Countdown / Live state refresh ticking state
    const [currentTime, setCurrentTime] = useState(dayjs());

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchOverview = async () => {
            const userRaw = localStorage.getItem("user");
            const user = userRaw ? JSON.parse(userRaw) : null;
            const studentId = user?.id as number | undefined;

            if (!studentId) {
                toast.error("Cannot identify student. Please login again.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                const courses = await getStudentCourses(studentId);
                setTotalCourses(Array.isArray(courses) ? courses.length : 0);

                const startDate = dayjs().format("YYYY-MM-DD");
                const endDate = dayjs().add(14, "day").format("YYYY-MM-DD");
                const sessionResponse = await api.get<UpcomingSession[]>(
                    `/schedule/student/${studentId}/sessions?startDate=${startDate}&endDate=${endDate}`
                );

                const now = dayjs();
                const upcoming = (sessionResponse.data || [])
                    .filter((session) => {
                        if (!session.date || !session.startTime || !session.endTime) return false;
                        const end = dayjs(`${session.date}T${session.endTime}`);
                        // Keep classes that haven't ended yet
                        return end.isAfter(now);
                    })
                    .sort((a, b) => {
                        const aStart = dayjs(`${a.date}T${a.startTime}`).valueOf();
                        const bStart = dayjs(`${b.date}T${b.startTime}`).valueOf();
                        return aStart - bStart;
                    });

                setStudentUpcomingClasses(upcoming);
            } catch (error) {
                console.error(error);
                toast.error("Cannot load dashboard overview.");
            } finally {
                setLoading(false);
            }
        };

        fetchOverview();

        // Interval to refresh countdown tickers and real-time live match checks
        const interval = setInterval(() => {
            setCurrentTime(dayjs());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Extract the very next active banner target session (ongoing or closest upcoming)
    const activeBannerSession = useMemo(() => {
        if (studentUpcomingClasses.length === 0) return null;
        return studentUpcomingClasses[0];
    }, [studentUpcomingClasses]);

    // Derived properties for active session status tracking
    const bannerStatus = useMemo(() => {
        if (!activeBannerSession || !activeBannerSession.date || !activeBannerSession.startTime || !activeBannerSession.endTime) {
            return { isLive: false, countdownText: "" };
        }

        const start = dayjs(`${activeBannerSession.date}T${activeBannerSession.startTime}`);
        const end = dayjs(`${activeBannerSession.date}T${activeBannerSession.endTime}`);

        if (currentTime.isAfter(start) && currentTime.isBefore(end)) {
            return { isLive: true, countdownText: "Class in session" };
        }

        // Calculate continuous countdown text strings
        const diffMs = start.diff(currentTime);
        const durationHours = Math.floor(diffMs / (1000 * 60 * 60));
        const durationMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const durationSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        let countdownText = "";
        if (durationHours > 0) countdownText += `${durationHours}h `;
        if (durationMinutes > 0 || durationHours > 0) countdownText += `${durationMinutes}m `;
        countdownText += `${durationSeconds}s`;

        return { isLive: false, countdownText };
    }, [activeBannerSession, currentTime]);

    // Handle student attendance log operations
    const handleAttendanceCheckIn = async (sessionId?: number) => {
        if (!sessionId) return;
        try {
            await api.post(`/attendance/session/${sessionId}/check-in`);
            toast.success("Attendance checked in successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to mark attendance. Ensure token or location window is open.");
        }
    };

    // Filter out the banner session from the bottom lists so it does not duplicate items
    const nonBannerSessions = useMemo(() => {
        if (studentUpcomingClasses.length <= 1) return [];
        return studentUpcomingClasses.slice(1);
    }, [studentUpcomingClasses]);

    // Compute paginated ledger chunk for secondary schedules
    const paginatedSessions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return nonBannerSessions.slice(startIndex, startIndex + itemsPerPage);
    }, [currentPage, nonBannerSessions, itemsPerPage]);

    const totalPages = Math.ceil(nonBannerSessions.length / itemsPerPage) || 1;

    const stats = useMemo(
        () => [
            {
                label: "Enrolled Courses",
                value: String(totalCourses),
                icon: BookOpen,
                color: "bg-[var(--color-main)]"
            },
            {
                label: "Sessions (Next 14 Days)",
                value: String(studentUpcomingClasses.length),
                icon: CalendarDays,
                color: "bg-gradient-to-r from-emerald-500 to-[var(--color-main)]"
            },
        ],
        [totalCourses, studentUpcomingClasses.length]
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Title Section */}
            <div>
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text)]">Overview</h1>
                <p className="text-xs font-semibold text-[var(--color-text)]/60 mt-0.5">Track your active curriculum and immediate agenda.</p>
            </div>
            {/* MAIN REAL-TIME ACTIVE BANNER PANEL */}
            {!loading && activeBannerSession && (
                <div className="border border-[var(--color-main)]/30 rounded-2xl overflow-hidden bg-gradient-to-r from-[var(--color-main)]/[0.04] via-[var(--color-main)]/[0.01] to-white shadow-xs p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-main)]/10 border border-[var(--color-main)]/20 text-[10px] font-black text-[var(--color-main)] uppercase tracking-wider">
                                {bannerStatus.isLive ? (
                                    <>
                                        <Radio size={12} className="animate-pulse text-[var(--color-main)]" />
                                        Live Active Session
                                    </>
                                ) : (
                                    "Immediate Upcoming Class"
                                )}
                            </span>
                            <h2 className="text-lg font-black text-[var(--color-text)] tracking-tight">
                                {activeBannerSession.courseName || "Course Block"}
                            </h2>
                        </div>

                        {/* Real-time Ticker/Attendance Interface */}
                        <div className="shrink-0">
                            {bannerStatus.isLive ? (
                                <button
                                    onClick={() => handleAttendanceCheckIn(activeBannerSession.sessionId)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-main)] text-white text-xs font-bold hover:opacity-90 shadow-sm active:scale-[0.98] transition-all"
                                >
                                    <CheckCircle2 size={15} className="stroke-[2.5]" />
                                    Verify Attendance Now
                                </button>
                            ) : (
                                <div className="bg-[var(--color-main)]/5 border border-[var(--color-main)]/20 px-4 py-2 rounded-xl text-center">
                                    <p className="text-[10px] font-bold text-[var(--color-main)] uppercase tracking-widest">Begins In</p>
                                    <p className="font-mono font-black text-sm text-[var(--color-main)] mt-0.5">{bannerStatus.countdownText}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metadata Context Fields */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-semibold text-[var(--color-text)]/70">
                        <span className="inline-flex items-center gap-1.5 text-[var(--color-main)] font-bold">
                            <CalendarDays size={14} className="stroke-[2.2]" />
                            {formatDateValue(activeBannerSession.date)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Clock3 size={14} className="stroke-[2.2] text-slate-400" />
                            {activeBannerSession.startTime?.slice(0, 5)} — {activeBannerSession.endTime?.slice(0, 5)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin size={14} className="stroke-[2.2] text-slate-400" />
                            Room: {activeBannerSession.roomName || "TBD"}
                        </span>
                    </div>
                </div>
            )}
            {/* Stats Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {loading
                    ? Array.from({ length: 2 }).map((_, index) => (
                        <div key={index} className="bg-white p-5 rounded-2xl border border-slate-200/60 flex items-center gap-4 animate-pulse">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-24 bg-slate-100 rounded"></div>
                                <div className="h-6 w-8 bg-slate-200 rounded"></div>
                            </div>
                        </div>
                    ))
                    : stats.map((stat, index) => (
                        <div key={index} className="bg-white p-5 rounded-2xl border border-slate-200/60 flex items-center gap-4 shadow-xs">
                            <div className={`${stat.color} p-3 rounded-xl text-white shadow-xs`}>
                                <stat.icon size={20} className="stroke-[2.2]" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-wider">{stat.label}</p>
                                <p className="text-2xl font-black text-[var(--color-text)] mt-0.5">{stat.value}</p>
                            </div>
                        </div>
                    ))
                }
            </div>



            {/* Main Layout Workspace Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* LEFT BLOCK: UPCOMING SCHEDULE LEDGER */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-xs font-black text-[var(--color-text)]/80 uppercase tracking-wider">Extended Schedule Calendar</h2>
                                <p className="text-xs font-medium text-[var(--color-text)]/60 mt-0.5">Your chronologically ordered upcoming agenda</p>
                            </div>
                        </div>

                        <div className="p-5">
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((n) => (
                                        <div key={n} className="h-20 bg-slate-50 rounded-xl border border-slate-100 animate-pulse flex flex-col justify-center px-4 space-y-2" />
                                    ))}
                                </div>
                            ) : nonBannerSessions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center max-w-sm mx-auto">
                                    <div className="p-4 bg-slate-50 rounded-full border border-slate-100 text-[var(--color-text)]/40 mb-4 shadow-inner">
                                        <CalendarDays size={28} className="stroke-[1.5]" />
                                    </div>
                                    <h3 className="text-sm font-bold text-[var(--color-text)]">No additional sessions</h3>
                                    <p className="text-xs font-medium text-[var(--color-text)]/60 mt-1">
                                        You do not have any alternate classes or lectures registered within the tracking frame.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        {paginatedSessions.map((session, index) => {
                                            // Since the active item is handled exclusively by the Banner, these items use standard styling safely
                                            return (
                                                <div
                                                    key={`${session.sessionId || "session"}-${index}`}
                                                    className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border p-4 transition-all duration-200 border-slate-200/70 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                                                >
                                                    {/* Standard edge Accent Indicator */}
                                                    <div className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-xl transition-colors duration-200 bg-slate-200 group-hover:bg-slate-300" />

                                                    <div className="pl-2">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h4 className="font-bold text-sm text-[var(--color-text)]">
                                                                {session.courseName || "Course Block"}
                                                            </h4>
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-semibold text-[var(--color-text)]/60">
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100">
                                                                <CalendarDays size={13} className="stroke-[2.2]" />
                                                                {formatDateValue(session.date)}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1.5 text-slate-500">
                                                                <Clock3 size={13} className="stroke-[2.2]" />
                                                                {session.startTime?.slice(0, 5)} — {session.endTime?.slice(0, 5)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="md:text-right pl-2 md:pl-0">
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all text-slate-600 bg-white border-slate-200 group-hover:border-slate-300">
                                                            <MapPin size={14} className="stroke-[2.2] text-slate-400" />
                                                            Room: {session.roomName || "TBD"}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination Controls Section */}
                                    {nonBannerSessions.length > itemsPerPage && (
                                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <p className="text-xs font-semibold text-[var(--color-text)]/60">
                                                Showing <span className="text-[var(--color-text)] font-bold">{Math.min(nonBannerSessions.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(nonBannerSessions.length, currentPage * itemsPerPage)}</span> of <span className="text-[var(--color-text)] font-bold">{nonBannerSessions.length}</span> schedules
                                            </p>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                                    disabled={currentPage === 1}
                                                    className="p-2 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <span className="text-xs font-bold text-[var(--color-text)] px-2">
                                                    {currentPage} / {totalPages}
                                                </span>
                                                <button
                                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                                    disabled={currentPage === totalPages}
                                                    className="p-2 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR PANEL: QUICK ACTIONS */}
                <div className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <h2 className="text-xs font-black text-[var(--color-main)] uppercase tracking-wider mb-3">Quick Actions</h2>
                        <div className="grid grid-cols-1 gap-2">
                            <Link href="/student/courses" className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white text-[var(--color-text)] font-bold text-xs hover:bg-slate-50 hover:border-slate-300 group transition-all active:scale-[0.98]">
                                <div className="flex items-center gap-3">
                                    <BookOpen size={15} className="text-slate-400 group-hover:text-[var(--color-main)] transition-colors" />
                                    My Enrolled Courses
                                </div>
                                <ArrowUpRight size={14} className="text-slate-300 group-hover:text-[var(--color-main)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </Link>

                            <Link href="/student/profile" className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white text-[var(--color-text)] font-bold text-xs hover:bg-slate-50 hover:border-slate-300 group transition-all active:scale-[0.98]">
                                <div className="flex items-center gap-3">
                                    <User size={15} className="text-slate-400 group-hover:text-[var(--color-main)] transition-colors" />
                                    My Profile
                                </div>
                                <ArrowUpRight size={14} className="text-slate-300 group-hover:text-[var(--color-main)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}