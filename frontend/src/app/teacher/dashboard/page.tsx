"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { 
    BookOpen, 
    Users, 
    CalendarDays, 
    Clock3, 
    MapPin, 
    CheckCircle2, 
    Building2, 
    Check, 
    X, 
    ChevronLeft, 
    ChevronRight 
} from "lucide-react";
import toast from "react-hot-toast";
import { getTeacherCourses, getStudentsInCourse, getInvitations, respondInvitation } from "@/services/courseService";
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

type Invitation = {
    id: number;
    centerName: string;
    role: string;
    status: string;
};

const ITEMS_PER_PAGE = 5;

function ActiveClassBanner({
    upcomingClasses,
    loading,
    nowTick,
    activeSession,
}: {
    upcomingClasses: UpcomingSession[];
    loading: boolean;
    nowTick: number;
    activeSession: UpcomingSession | null;
}) {
    const countdown = useMemo(() => {
        if (!activeSession) return null;
        
        const start = dayjs(`${activeSession.date}T${activeSession.startTime}`);
        const diffMs = start.valueOf() - nowTick;
        
        if (diffMs <= 0) return { isLive: true, mm: "00", ss: "00" };

        const totalSeconds = Math.floor(diffMs / 1000);
        const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
        const ss = String(totalSeconds % 60).padStart(2, "0");
        return { isLive: false, mm, ss };
    }, [activeSession, nowTick]);

    if (loading) {
        return (
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4">
                <div className="h-4 w-56 rounded bg-slate-200 mb-3 animate-pulse" />
                <div className="h-10 w-full rounded bg-slate-200 animate-pulse" />
            </div>
        );
    }

    if (!activeSession) return null;

    const statusLabel = countdown?.isLive 
        ? "Now Active" 
        : `Starts in ${countdown?.mm}:${countdown?.ss}`;

    return (
        <div className="rounded-xl border-2 border-slate-200 bg-gradient-to-r from-[var(--color-main)]/10 to-[var(--color-main)]/20 text-[var(--color-text)] p-4 sm:p-6 shadow-md transition-all duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="min-w-0">
                    <span className="bg-[var(--color-main)] text-white text-[10px] font-black tracking-widest px-2 py-0.5 rounded uppercase">
                        {statusLabel}
                    </span>
                    <div className="mt-2">
                        <div className="text-lg sm:text-xl font-black leading-tight truncate text-[var(--color-text)]">
                            {activeSession.courseName || "Course"}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            <span className="inline-flex items-center gap-1.5">
                                <Clock3 size={13} className="text-[var(--color-main)]" />
                                {activeSession.startTime?.slice(0, 5)} - {activeSession.endTime?.slice(0, 5)}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <MapPin size={13} className="text-[var(--color-main)]" />
                                {activeSession.roomName || "TBD"}
                            </span>
                        </div>
                    </div>
                </div>

                <Link
                    href="/teacher/schedule"
                    className="inline-flex items-center justify-center rounded-xl bg-[var(--color-main)] text-white font-bold px-4 py-2.5 hover:opacity-90 transition text-sm active:scale-[0.99] shadow-sm shrink-0"
                >
                    <CheckCircle2 size={16} className="mr-2" />
                    Take Attendance
                </Link>
            </div>
        </div>
    );
}

export default function TeacherDashboard() {
    const [loading, setLoading] = useState(true);
    const [totalCourses, setTotalCourses] = useState(0);
    const [totalStudents, setTotalStudents] = useState(0);
    const [upcomingClasses, setUpcomingClasses] = useState<UpcomingSession[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [nowTick, setNowTick] = useState(() => Date.now());

    useEffect(() => {
        const t = window.setInterval(() => setNowTick(Date.now()), 1000);
        return () => window.clearInterval(t);
    }, []);

    const fetchOverview = async () => {
        const userRaw = localStorage.getItem("user");
        const user = userRaw ? JSON.parse(userRaw) : null;
        const teacherId = user?.id as number | undefined;

        if (!teacherId) {
            toast.error("Cannot identify teacher. Please login again.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const courses = await getTeacherCourses(teacherId);
            setTotalCourses(Array.isArray(courses) ? courses.length : 0);

            const studentLists = await Promise.all(
                (courses || []).map(async (course) => {
                    try {
                        const students = await getStudentsInCourse(course.id);
                        return { courseName: course.name, students: students || [] };
                    } catch {
                        return { courseName: course.name, students: [] };
                    }
                })
            );

            const uniqueStudentIds = new Set<number>();
            studentLists.forEach(({ students }) => {
                students.forEach((student: { id?: number }) => {
                    if (typeof student?.id === "number") {
                        uniqueStudentIds.add(student.id);
                    }
                });
            });
            setTotalStudents(uniqueStudentIds.size);

            const startDate = dayjs().format("YYYY-MM-DD");
            const endDate = dayjs().add(14, "day").format("YYYY-MM-DD");
            const sessionResponse = await api.get<UpcomingSession[]>(
                `/schedule/teacher/${teacherId}/sessions?startDate=${startDate}&endDate=${endDate}`
            );

            const now = dayjs();
            const upcoming = (sessionResponse.data || [])
                .filter((session) => {
                    if (!session.date || !session.startTime || !session.endTime) return false;
                    const end = dayjs(`${session.date}T${session.endTime}`);
                    return end.isAfter(now);
                })
                .sort((a, b) => dayjs(`${a.date}T${a.startTime}`).valueOf() - dayjs(`${b.date}T${b.startTime}`).valueOf());

            setUpcomingClasses(upcoming);

            try {
                const invites = await getInvitations(teacherId);
                setInvitations(invites.filter((inv: Invitation) => inv.status === "PENDING"));
            } catch {
                setInvitations([]);
            }

        } catch (error) {
            console.error(error);
            toast.error("Cannot load dashboard overview.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverview();
    }, []);

    const handleInviteAction = async (id: number, status: "ACCEPTED" | "REJECTED") => {
        try {
            await respondInvitation(id, status);
            toast.success(`Invitation ${status.toLowerCase()} successfully!`);
            setInvitations((prev) => prev.filter((item) => item.id !== id));
        } catch {
            toast.error("Failed to respond to center invitation.");
        }
    };

    // Determine which session is currently the active banner candidate
    const activeSession = useMemo(() => {
        if (!upcomingClasses.length) return null;
        
        const activeCandidates = upcomingClasses
            .filter((s) => {
                const end = dayjs(`${s.date}T${s.endTime}`);
                return end.valueOf() > nowTick;
            });
            
        return activeCandidates[0] ?? null;
    }, [upcomingClasses, nowTick]);

    // Filter out the current active session completely from the upcoming schedule feed
    const filteredUpcomingClasses = useMemo(() => {
        if (!activeSession) return upcomingClasses;
        return upcomingClasses.filter(
            (session) => session.sessionId !== activeSession.sessionId
        );
    }, [upcomingClasses, activeSession]);

    // Ledger Items Pagination Logic based on filtered array
    const totalPages = Math.ceil(filteredUpcomingClasses.length / ITEMS_PER_PAGE);
    const paginatedClasses = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredUpcomingClasses.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredUpcomingClasses, currentPage]);

    const stats = useMemo(
        () => [
            { label: "Teaching Courses", value: String(totalCourses), icon: BookOpen },
            { label: "Active Students", value: String(totalStudents), icon: Users },
            { label: "Classes (14 Days)", value: String(upcomingClasses.length), icon: CalendarDays },
        ],
        [totalCourses, totalStudents, upcomingClasses.length]
    );

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-[var(--color-text)]">Overview</h1>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">Welcome back! Here is your daily teaching brief.</p>
                </div>
            </div>

            {/* LIVE CLASS BANNER COMPONENT */}
            <ActiveClassBanner upcomingClasses={upcomingClasses} loading={loading} nowTick={nowTick} activeSession={activeSession} />

            {/* STATS ROW BLOCKS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {loading
                    ? Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="bg-white p-5 rounded-xl border border-slate-200/60 flex items-center gap-4 animate-pulse">
                            <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-24 bg-slate-200 rounded"></div>
                                <div className="h-6 w-8 bg-slate-300 rounded"></div>
                            </div>
                        </div>
                    ))
                    : stats.map((stat, index) => (
                        <div key={index} className="bg-white p-5 rounded-xl border border-slate-200/60 flex items-center gap-4 shadow-2xs">
                            <div className="bg-[var(--color-main)] p-3 rounded-xl text-white shadow-xs">
                                <stat.icon size={20} className="stroke-[2.2]" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[var(--color-main)] uppercase tracking-wider">{stat.label}</p>
                                <p className="text-2xl font-black text-[var(--color-text)] mt-0.5">{stat.value}</p>
                            </div>
                        </div>
                    ))}
            </div>

            {/* MAIN WORKING PANELS SPLIT VIEW GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT BLOCK: UPCOMING SCHEDULE LEDGER W/ PAGINATION */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-2xs flex flex-col justify-between min-h-[380px]">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-black text-[var(--color-main)] uppercase tracking-wider">Upcoming Schedule</h2>
                                <Link href="/teacher/schedule" className="text-xs font-bold text-[var(--color-main)] hover:underline">View Calendar</Link>
                            </div>

                            {loading ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                                    ))}
                                </div>
                            ) : filteredUpcomingClasses.length === 0 ? (
                                <p className="text-xs font-medium text-slate-500 py-12 text-center">No upcoming classes scheduled.</p>
                            ) : (
                                <div className="space-y-2.5">
                                    {paginatedClasses.map((session, index) => {
                                        // The first absolute element on the absolute first page is always "Next Up"
                                        const isNextUp = currentPage === 1 && index === 0;

                                        return (
                                            <div 
                                                key={index} 
                                                className={`rounded-xl border p-3 flex items-center justify-between text-xs transition duration-200 ${
                                                    isNextUp 
                                                        ? "border-[var(--color-main)] bg-[var(--color-main)]/5 shadow-2xs font-semibold" 
                                                        : "border-slate-100 bg-slate-50/40 hover:bg-slate-50"
                                                }`}
                                            >
                                                <div className="min-w-0">
                                                    <div className="font-bold text-[var(--color-text)] truncate flex items-center gap-2">
                                                        {session.courseName}
                                                        {isNextUp && (
                                                            <span className="text-[10px] font-extrabold uppercase bg-[var(--color-main)] text-white px-1.5 py-0.5 rounded tracking-wider">
                                                                Next Up
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-slate-500 font-medium mt-1 flex items-center gap-3">
                                                        <span className="flex items-center gap-1"><CalendarDays size={12} className="text-[var(--color-main)]" />{formatDateValue(session.date)}</span>
                                                        <span className="flex items-center gap-1"><Clock3 size={12} className="text-[var(--color-main)]" />{session.startTime?.slice(0, 5)} - {session.endTime?.slice(0, 5)}</span>
                                                        <span className="flex items-center gap-1"><MapPin size={12} className="text-[var(--color-main)]" />{session.roomName || "TBD"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* PAGINATION NAVIGATION CONTROLS */}
                        {!loading && totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                                <p className="text-xs font-semibold text-slate-500">
                                    Showing <span className="text-[var(--color-text)] font-bold">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredUpcomingClasses.length)}</span> to{" "}
                                    <span className="text-[var(--color-text)] font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredUpcomingClasses.length)}</span> of{" "}
                                    <span className="text-[var(--color-text)] font-bold">{filteredUpcomingClasses.length}</span> classes
                                </p>
                                <nav className="inline-flex gap-1">
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`px-3 py-1 text-xs font-bold rounded-lg transition border ${
                                                currentPage === i + 1
                                                    ? "bg-[var(--color-main)] border-[var(--color-main)] text-white"
                                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </nav>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDEBAR PANEL: ACTION & CENTER MANAGEMENT HUB */}
                <div className="space-y-6">
                    {/* HUB 1: QUICK ROUTING UTILITY PANEL */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-2xs">
                        <h2 className="text-sm font-black text-[var(--color-main)] uppercase tracking-wider mb-3">Quick Actions</h2>
                        <div className="grid grid-cols-1 gap-2">
                            <Link href="/teacher/centers" 
                            className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white text-[var(--color-text)] font-bold text-xs hover:bg-slate-50 transition">
                                <Building2 size={14} className="text-[var(--color-main)]" />
                                Your Centers
                            </Link>
                            <Link href="/teacher/courses" 
                            className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white text-[var(--color-text)] font-bold text-xs hover:bg-slate-50 transition">
                                <BookOpen size={14} className="text-[var(--color-main)]"/>
                                Your Courses
                            </Link>
                            <Link href="/teacher/students" 
                            className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white text-[var(--color-text)] font-bold text-xs hover:bg-slate-50 transition">
                                <Users size={14} className="text-[var(--color-main)]" />
                                Your Students
                            </Link>
                        </div>
                    </div>

                    {/* HUB 2: CENTER AFFILIATIONS & WORKING INVITATIONS */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-2xs">
                        <h2 className="text-sm font-black text-[var(--color-main)] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Building2 size={15} className="text-[var(--color-main)]" />
                            Center Requests
                        </h2>
                        <p className="text-[11px] font-semibold text-slate-400 mb-3 uppercase tracking-wider">Pending Affiliations</p>

                        {loading ? (
                            <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                        ) : invitations.length === 0 ? (
                            <p className="text-xs font-medium text-slate-400 py-2">No pending invitation available.</p>
                        ) : (
                            <div className="space-y-2">
                                {invitations.map((invite) => (
                                    <div key={invite.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                                        <div className="font-bold text-slate-900">{invite.centerName}</div>
                                        <div className="text-slate-500 font-medium mt-0.5">Role: {invite.role}</div>
                                        <div className="flex gap-1.5 mt-3">
                                            <button
                                                onClick={() => handleInviteAction(invite.id, "ACCEPTED")}
                                                className="flex-1 inline-flex items-center justify-center py-1.5 bg-[var(--color-main)] text-white font-bold rounded-md hover:opacity-90 transition"
                                            >
                                                <Check size={12} className="mr-1" /> Accept
                                            </button>
                                            <button
                                                onClick={() => handleInviteAction(invite.id, "REJECTED")}
                                                className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                                            >
                                                <X size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}