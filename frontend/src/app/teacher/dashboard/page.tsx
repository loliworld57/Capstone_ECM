"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { BookOpen, Users, CalendarDays, Clock3, MapPin, CheckCircle2, Megaphone, ClipboardList, BarChart3, AlertCircle, Building2, Check, X } from "lucide-react";
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

type AtRiskStudent = {
    id: number;
    name: string;
    courseName: string;
    missedCount: number;
};

function ActiveClassBanner({
    upcomingClasses,
    loading,
}: {
    upcomingClasses: UpcomingSession[];
    loading: boolean;
}) {
    const [nowTick, setNowTick] = useState(() => Date.now());

    useEffect(() => {
        const t = window.setInterval(() => setNowTick(Date.now()), 1000);
        return () => window.clearInterval(t);
    }, []);

    const active = useMemo(() => {
        if (loading) return null;
        const threshold = dayjs(nowTick + 30 * 60 * 1000);

        const candidates = (upcomingClasses || [])
            .filter((s) => s.date && s.startTime)
            .map((s) => {
                const start = dayjs(`${s.date}T${s.startTime}`);
                return { ...s, _startMs: start.valueOf() };
            })
            .filter((s) => {
                const startMs = s._startMs as number;
                return startMs <= threshold.valueOf() && startMs >= nowTick - 60 * 60 * 1000;
            })
            .sort((a, b) => (a._startMs as number) - (b._startMs as number));

        return candidates[0] ?? null;
    }, [loading, upcomingClasses, nowTick]);

    const countdown = useMemo(() => {
        if (!active?.date || !active?.startTime) return null;
        const start = dayjs(`${active.date}T${active.startTime}`).valueOf();
        const diffMs = start - nowTick;
        if (diffMs < 0) return { totalSeconds: 0, mm: "00", ss: "00" };
        const totalSeconds = Math.floor(diffMs / 1000);
        const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
        const ss = String(totalSeconds % 60).padStart(2, "0");
        return { totalSeconds, mm, ss };
    }, [active, nowTick]);

    if (loading) {
        return (
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4">
                <div className="h-4 w-56 rounded bg-slate-200 mb-3 animate-pulse" />
                <div className="h-10 w-full rounded bg-slate-200 animate-pulse" />
            </div>
        );
    }

    if (!active) return null;

    const minutesOrNow = countdown?.totalSeconds === 0 ? "Now Active" : `Starts in ${countdown?.mm}:${countdown?.ss}`;

    return (
        <div className="rounded-xl border-2 border-indigo-500 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 sm:p-6 shadow-md transition-all duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="min-w-0">
                    <span className="bg-white/20 text-white text-[10px] font-black tracking-widest px-2 py-0.5 rounded uppercase">
                        {minutesOrNow}
                    </span>
                    <div className="mt-2">
                        <div className="text-lg sm:text-xl font-black leading-tight truncate">{active.courseName || "Course"}</div>
                        <div className="text-xs font-semibold text-white/90 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            <span className="inline-flex items-center gap-1.5">
                                <Clock3 size={13} />
                                {active.startTime?.slice(0, 5)} - {active.endTime?.slice(0, 5)}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <MapPin size={13} />
                                {active.roomName || "TBD"}
                            </span>
                        </div>
                    </div>
                </div>

                <Link
                    href="/teacher/schedule"
                    className="inline-flex items-center justify-center rounded-xl bg-white text-indigo-700 font-bold px-4 py-2.5 hover:bg-slate-100 transition text-sm active:scale-[0.99] shadow-sm shrink-0"
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
    const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);

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

            // 1. Fetch Courses
            const courses = await getTeacherCourses(teacherId);
            setTotalCourses(Array.isArray(courses) ? courses.length : 0);

            // 2. Fetch Students & Identify At-Risk Students (Stubbed logic based on data)
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
            const riskPool: AtRiskStudent[] = [];

            studentLists.forEach(({ courseName, students }) => {
                students.forEach((student: { id?: number; name?: string; missedSessions?: number }) => {
                    if (typeof student?.id === "number") {
                        uniqueStudentIds.add(student.id);
                        
                        // If student has missed more than 2 classes, flag them on the dashboard
                        if ((student.missedSessions ?? 0) >= 2) {
                            riskPool.push({
                                id: student.id,
                                name: student.name || "Unknown Student",
                                courseName: courseName,
                                missedCount: student.missedSessions || 2
                            });
                        }
                    }
                });
            });
            setTotalStudents(uniqueStudentIds.size);
            setAtRiskStudents(riskPool.slice(0, 3)); // Display top 3 critical issues

            // 3. Fetch Schedules
            const startDate = dayjs().format("YYYY-MM-DD");
            const endDate = dayjs().add(14, "day").format("YYYY-MM-DD");
            const sessionResponse = await api.get<UpcomingSession[]>(
                `/schedule/teacher/${teacherId}/sessions?startDate=${startDate}&endDate=${endDate}`
            );

            const now = dayjs();
            const upcoming = (sessionResponse.data || [])
                .filter((session) => {
                    if (!session.date || !session.startTime) return false;
                    const start = dayjs(`${session.date}T${session.startTime}`);
                    return start.isAfter(now) || start.isSame(now);
                })
                .sort((a, b) => dayjs(`${a.date}T${a.startTime}`).valueOf() - dayjs(`${b.date}T${b.startTime}`).valueOf())
                .slice(0, 5);

            setUpcomingClasses(upcoming);

            // 4. Fetch Center Invitations
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

    const stats = useMemo(
        () => [
            { label: "Teaching Courses", value: String(totalCourses), icon: BookOpen, color: "bg-indigo-600" },
            { label: "Active Students", value: String(totalStudents), icon: Users, color: "bg-indigo-600" },
            { label: "Classes (14 Days)", value: String(upcomingClasses.length), icon: CalendarDays, color: "bg-indigo-600" },
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
            <ActiveClassBanner upcomingClasses={upcomingClasses} loading={loading} />

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
                            <div className={`${stat.color} p-3 rounded-xl text-white shadow-xs`}>
                                <stat.icon size={20} className="stroke-[2.2]" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-900 mt-0.5">{stat.value}</p>
                            </div>
                        </div>
                    ))}
            </div>

            {/* MAIN WORKING PANELS SPLIT VIEW GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT BLOCK: UPCOMING SCHEDULE LEDGER */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-2xs">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Upcoming Schedule</h2>
                            <Link href="/teacher/schedule" className="text-xs font-bold text-indigo-600 hover:underline">View Calendar</Link>
                        </div>

                        {loading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : upcomingClasses.length === 0 ? (
                            <p className="text-xs font-medium text-slate-500 py-4 text-center">No upcoming classes scheduled.</p>
                        ) : (
                            <div className="space-y-2.5">
                                {upcomingClasses.map((session, index) => (
                                    <div key={index} className="rounded-xl border border-slate-100 bg-slate-50/40 p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                                        <div className="min-w-0">
                                            <div className="font-bold text-slate-900 truncate">{session.courseName}</div>
                                            <div className="text-slate-500 font-semibold mt-1 flex items-center gap-3">
                                                <span className="flex items-center gap-1"><CalendarDays size={12} />{formatDateValue(session.date)}</span>
                                                <span className="flex items-center gap-1"><Clock3 size={12} />{session.startTime?.slice(0, 5)}</span>
                                                <span className="flex items-center gap-1"><MapPin size={12} />{session.roomName || "TBD"}</span>
                                            </div>
                                        </div>
                                        <span className="px-2 py-0.5 bg-slate-200/60 font-bold text-slate-700 rounded text-[10px]">Confirmed</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDEBAR PANEL: ACTION & CENTER MANAGEMENT HUB */}
                <div className="space-y-6">
                    {/* HUB 1: QUICK ROUTING UTILITY PANEL */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-2xs">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">Quick Actions</h2>
                        <div className="grid grid-cols-1 gap-2">
                            <Link href="/teacher/centers" 
                            className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-bold text-xs hover:bg-slate-50 transition">
                                <Building2 size={14} />
                                Your Centers
                            </Link>
                            <Link href="/teacher/courses" 
                            className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-bold text-xs hover:bg-slate-50 transition">
                                <BookOpen size={14}/>
                                Your Courses
                            </Link>
                            <Link href="/teacher/students" 
                            className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-bold text-xs hover:bg-slate-50 transition">
                                <Users size={14} />
                                Your Students
                            </Link>
                        </div>
                    </div>

                    {/* HUB 2: CENTER AFFILIATIONS & WORKING INVITATIONS */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-2xs">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Building2 size={15} className="text-slate-400" />
                            Center Requests
                        </h2>
                        <p className="text-[11px] font-semibold text-slate-400 mb-3 uppercase tracking-wider">Pending Affiliations</p>

                        {loading ? (
                            <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                        ) : invitations.length === 0 ? (
                            <p className="text-xs font-medium text-slate-400 py-2">No pending contract offers available.</p>
                        ) : (
                            <div className="space-y-2">
                                {invitations.map((invite) => (
                                    <div key={invite.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                                        <div className="font-bold text-slate-900">{invite.centerName}</div>
                                        <div className="text-slate-500 font-medium mt-0.5">Role: {invite.role}</div>
                                        <div className="flex gap-1.5 mt-3">
                                            <button
                                                onClick={() => handleInviteAction(invite.id, "ACCEPTED")}
                                                className="flex-1 inline-flex items-center justify-center py-1.5 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 transition"
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