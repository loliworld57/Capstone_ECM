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
            { label: "Teaching Courses", value: String(totalCourses), icon: BookOpen, color: "bg-[var(--color-main)]" },
            { label: "Teaching Students", value: String(totalStudents), icon: Users, color: "bg-[var(--color-main)]" },
            { label: "Upcoming Classes", value: String(upcomingClasses.length), icon: CalendarDays, color: "bg-[var(--color-main)]" },
        ],
        [totalCourses, totalStudents, upcomingClasses.length]
    );

    return (
        <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {loading
                    ? Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={index}
                            className="bg-white p-6 rounded-xl shadow-sm flex items-center gap-4 animate-pulse"
                        >
                            {/* Icon skeleton */}
                            <div className="w-14 h-14 rounded-lg bg-gray-300"></div>

                            {/* Text skeleton */}
                            <div className="flex-1">
                                <div className="h-4 w-32 rounded bg-gray-300 mb-3"></div>
                                <div className="h-7 w-16 rounded bg-gray-200"></div>
                            </div>
                        </div>
                    ))
                    : stats.map((stat, index) => (
                        <div
                            key={index}
                            className="bg-white p-6 rounded-xl shadow-sm flex items-center gap-4"
                        >
                            <div className={`${stat.color} p-4 rounded-lg text-white`}>
                                <stat.icon size={24} />
                            </div>

                            <div>
                                <p className="text-[var(--color-text)] font-semibold">
                                    {stat.label}
                                </p>

                                <p className="text-2xl font-bold text-[var(--color-alert)]">
                                    {stat.value}
                                </p>
                            </div>
                        </div>
                    ))}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-[var(--color-main)]/30">
                <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">Upcoming Classes</h2>

                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={index}
                                className="rounded-lg border border-[var(--color-main)]/20 bg-[var(--color-soft-white)] p-3 animate-pulse"
                            >
                                {/* Course title */}
                                <div className="h-4 w-40 rounded bg-gray-300 mb-3"></div>

                                {/* Info row */}
                                <div className="flex flex-wrap gap-3">
                                    <div className="h-3 w-24 rounded bg-gray-200"></div>
                                    <div className="h-3 w-28 rounded bg-gray-200"></div>
                                    <div className="h-3 w-20 rounded bg-gray-200"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : upcomingClasses.length === 0 ? (
                    <p className="text-sm text-gray-500">No upcoming classes in the next 14 days.</p>
                ) : (
                    <div className="space-y-3">
                        {upcomingClasses.map((session, index) => (
                            <div
                                key={`${session.sessionId || "session"}-${index}`}
                                className="rounded-lg border border-[var(--color-main)]/30 bg-[var(--color-soft-white)] p-3"
                            >
                                <div className="font-semibold text-[var(--color-text)]">
                                    {session.courseName || "Course"}
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                                    <span className="inline-flex items-center gap-1">
                                        <CalendarDays size={14} />
                                        {formatDateValue(session.date)}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <Clock3 size={14} />
                                        {session.startTime?.slice(0, 5)} - {session.endTime?.slice(0, 5)}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin size={14} />
                                        {session.roomName || "TBD"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}