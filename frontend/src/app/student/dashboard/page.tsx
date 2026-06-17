"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { BookOpen, CalendarDays, Clock3, MapPin, ArrowUpRight, User } from "lucide-react";
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
                        if (!session.date || !session.startTime) return false;
                        const start = dayjs(`${session.date}T${session.startTime}`);
                        return start.isAfter(now) || start.isSame(now);
                    })
                    .sort((a, b) => {
                        const aStart = dayjs(`${a.date}T${a.startTime}`).valueOf();
                        const bStart = dayjs(`${b.date}T${b.startTime}`).valueOf();
                        return aStart - bStart;
                    })
                    .slice(0, 8);

                setStudentUpcomingClasses(upcoming);
            } catch (error) {
                console.error(error);
                toast.error("Cannot load dashboard overview.");
            } finally {
                setLoading(false);
            }
        };

        fetchOverview();
    }, []);

    const stats = useMemo(
        () => [
            {
                label: "Enrolled Courses",
                value: String(totalCourses),
                icon: BookOpen,
                color: "bg-linear-to-r from-indigo-500 to-[var(--color-main)]"
            },
            {
                label: "Sessions (Next 14 Days)",
                value: String(studentUpcomingClasses.length),
                icon: CalendarDays,
                color: "bg-linear-to-r from-emerald-500 to-[var(--color-main)]"
            },
        ],
        [totalCourses, studentUpcomingClasses.length]
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Title Section */}
            <div>
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text)]">Overview</h1>
                <p className="text-xs font-semibold text-[var(--color-text)] mt-0.5">Track your active curriculum and immediate agenda.</p>
            </div>

            {/* Stats Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {loading
                    ? Array.from({ length: 2 }).map((_, index) => (
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
                                <p className="text-xs font-bold text-[var(--color-main)] uppercase tracking-wider">{stat.label}</p>
                                <p className="text-2xl font-black text-[var(--color-text)] mt-0.5">{stat.value}</p>
                            </div>
                        </div>
                    ))
                }
            </div>

            {/* Main Working Panel Grid Layout split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* LEFT BLOCK: UPCOMING SCHEDULE LEDGER */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-sm font-black text-[var(--color-main)] uppercase tracking-wider">Upcoming Academic Schedule</h2>
                                <p className="text-xs font-medium text-slate-500 mt-0.5">Your chronologically ordered upcoming lectures</p>
                            </div>
                            {!loading && studentUpcomingClasses.length > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 uppercase tracking-wide">
                                    Live Agenda
                                </span>
                            )}
                        </div>

                        <div className="p-6">
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((n) => (
                                        <div key={n} className="h-20 bg-slate-50 rounded-xl border border-slate-100 animate-pulse flex flex-col justify-center px-4 space-y-2" />
                                    ))}
                                </div>
                            ) : studentUpcomingClasses.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center max-w-sm mx-auto">
                                    <div className="p-4 bg-slate-50 rounded-full border border-slate-100 text-slate-400 mb-4 shadow-inner">
                                        <CalendarDays size={28} className="stroke-[1.5]" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900">No scheduled sessions</h3>
                                    <p className="text-xs font-medium text-slate-500 mt-1">
                                        You do not have any classes or lectures registered within the standard 14-day tracking frame.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3.5">
                                    {studentUpcomingClasses.map((session, index) => (
                                        <div
                                            key={`${session.sessionId || "session"}-${index}`}
                                            className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white p-4 hover:border-indigo-200 hover:bg-slate-50/30 transition-all duration-200 shadow-sm"
                                        >
                                            <div className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-xl bg-slate-200 group-hover:bg-indigo-500 transition-colors duration-200" />

                                            <div className="pl-2">
                                                <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-950 transition-colors">
                                                    {session.courseName || "Course Block"}
                                                </h4>
                                                <div className="mt-2 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-slate-500">
                                                    <span className="inline-flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                                        <CalendarDays size={13} className="text-slate-500 stroke-[2]" />
                                                        {formatDateValue(session.date)}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Clock3 size={13} className="text-slate-400 stroke-[2]" />
                                                        {session.startTime?.slice(0, 5)} — {session.endTime?.slice(0, 5)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="md:text-right pl-2 md:pl-0">
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg group-hover:border-indigo-100 group-hover:bg-indigo-50/30 group-hover:text-indigo-900 transition-all">
                                                    <MapPin size={13} className="text-slate-400 group-hover:text-indigo-400 stroke-[2]" />
                                                    Room: {session.roomName || "TBD"}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR PANEL: QUICK ACTIONS */}
                <div className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                        <h2 className="text-sm font-black text-[var(--color-main)] uppercase tracking-wider mb-3">Quick Action</h2>
                        <div className="grid grid-cols-1 gap-2.5">
                            <Link href="/student/courses" className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold text-xs hover:bg-slate-50 hover:border-slate-300 group transition-all">
                                <div className="flex items-center gap-3">
                                    <BookOpen size={15} className="text-slate-400 group-hover:text-slate-600" />
                                    My Enrolled Courses
                                </div>
                                <ArrowUpRight size={14} className="text-slate-300 group-hover:text-slate-500 transition" />
                            </Link>
                            <Link href="/student/profile" className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold text-xs hover:bg-slate-50 hover:border-slate-300 group transition-all">
                                <div className="flex items-center gap-3">
                                    <User size={15} className="text-slate-400 group-hover:text-slate-600" />
                                    My Profile
                                </div>
                                <ArrowUpRight size={14} className="text-slate-300 group-hover:text-slate-500 transition" />
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}