"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { BookOpen, Users, CalendarDays, Clock3, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { getTeacherCourses, getStudentsInCourse } from "@/services/courseService";
import api from "@/utils/axiosConfig";
import { formatDateValue } from "@/utils/dateFormat";

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

export default function TeacherDashboard() {
    const [loading, setLoading] = useState(true);
    const [totalCourses, setTotalCourses] = useState(0);
    const [totalStudents, setTotalStudents] = useState(0);
    const [upcomingClasses, setUpcomingClasses] = useState<UpcomingSession[]>([]);

    useEffect(() => {
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
                            return await getStudentsInCourse(course.id);
                        } catch {
                            return [];
                        }
                    })
                );

                const uniqueStudentIds = new Set<number>();
                studentLists.forEach((students) => {
                    (students || []).forEach((student: { id?: number }) => {
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

                setUpcomingClasses(upcoming);
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
            { label: "Teaching Courses", value: String(totalCourses), icon: BookOpen, color: "bg-indigo-600" },
            { label: "Teaching Students", value: String(totalStudents), icon: Users, color: "bg-indigo-600" },
            { label: "Upcoming Classes", value: String(upcomingClasses.length), icon: CalendarDays, color: "bg-indigo-600" },
        ],
        [totalCourses, totalStudents, upcomingClasses.length]
    );

    return (
        <div className="w-full">
            <h1 className="text-2xl font-black tracking-tight text-[var(--color-text)] mb-6">Overview</h1>

            {/* STATS ROW ARRAY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {loading
                    ? Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={index}
                            className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-xs flex items-center gap-4 animate-pulse"
                        >
                            <div className="w-14 h-14 rounded-xl bg-slate-200 shrink-0"></div>
                            <div className="flex-1">
                                <div className="h-4 w-32 rounded bg-slate-200 mb-2.5"></div>
                                <div className="h-7 w-12 rounded bg-slate-300"></div>
                            </div>
                        </div>
                    ))
                    : stats.map((stat, index) => (
                        <div
                            key={index}
                            className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-xs flex items-center gap-4 hover:border-slate-300 transition duration-200"
                        >
                            <div className={`${stat.color} p-4 rounded-xl text-white shadow-md`}>
                                <stat.icon size={22} className="stroke-[2.2]" />
                            </div>

                            <div>
                                <p className="text-sm font-bold text-slate-500 tracking-wide">
                                    {stat.label}
                                </p>
                                <p className="text-2xl font-black text-slate-900 mt-0.5">
                                    {stat.value}
                                </p>
                            </div>
                        </div>
                    ))}
            </div>

            {/* UPCOMING CLASSES DISPLAY MODULE */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <h2 className="text-base font-bold text-slate-900 mb-4 tracking-tight">Upcoming Classes (Next 14 Days)</h2>

                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={index}
                                className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 animate-pulse"
                            >
                                <div className="h-4 w-48 rounded bg-slate-200 mb-3"></div>
                                <div className="flex flex-wrap gap-4">
                                    <div className="h-3 w-24 rounded bg-slate-200"></div>
                                    <div className="h-3 w-28 rounded bg-slate-200"></div>
                                    <div className="h-3 w-20 rounded bg-slate-200"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : upcomingClasses.length === 0 ? (
                    <p className="text-sm font-medium text-slate-500 py-2">No upcoming classes scheduled in the next 14 days.</p>
                ) : (
                    <div className="space-y-3">
                        {upcomingClasses.map((session, index) => (
                            <div
                                key={`${session.sessionId || "session"}-${index}`}
                                className="rounded-xl border border-slate-200/80 bg-white p-4 hover:bg-slate-50/50 transition-colors duration-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                            >
                                <div>
                                    <div className="font-bold text-sm text-slate-900 tracking-tight">
                                        {session.courseName || "Course"}
                                    </div>

                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-600">
                                        <span className="inline-flex items-center gap-1 text-slate-700">
                                            <CalendarDays size={14} className="text-slate-400 stroke-[2.2]" />
                                            {formatDateValue(session.date)}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-slate-700">
                                            <Clock3 size={14} className="text-slate-400 stroke-[2.2]" />
                                            {session.startTime?.slice(0, 5)} - {session.endTime?.slice(0, 5)}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-slate-700">
                                            <MapPin size={14} className="text-slate-400 stroke-[2.2]" />
                                            {session.roomName || "TBD"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}