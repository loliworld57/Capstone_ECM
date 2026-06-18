"use client";

import { useEffect, useMemo, useState } from "react";
import {
    addDays,
    endOfMonth,
    endOfWeek,
    endOfDay,
    format,
    getDay,
    isAfter,
    isBefore,
    parse,
    startOfDay,
    startOfMonth,
    startOfWeek,
} from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { enUS } from "date-fns/locale/en-US";
import type { View } from "react-big-calendar";
import toast from "react-hot-toast";
import api from "@/utils/axiosConfig";
import { getStudentsInCourse, getTeacherCourses } from "@/services/courseService";
import { CenterClassSlot } from "@/services/centerService";
import { isCourseOngoing } from "@/utils/courseStatus";
import { Clock, MapPin, Users, BookOpen, Calendar as CalendarIcon, Loader2 } from "lucide-react";

interface ScheduleEvent {
    id: number;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    courseName: string;
    teacherName: string;
    roomName: string;
    timeText: string;
    studentsText: string;
}

const toIsoDate = (d: Date) => format(d, "yyyy-MM-dd");

const combineDateAndTime = (dateStr: string, timeStr: string) => {
    const hhmmss = (timeStr || "00:00:00").slice(0, 8);
    return new Date(`${dateStr}T${hhmmss}`);
};

const DAY_OF_WEEK_MAP: Record<string, number> = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
};

const getSlotDayNames = (slot: CenterClassSlot): string[] => {
    if (Array.isArray(slot.daysOfWeek) && slot.daysOfWeek.length > 0) {
        return slot.daysOfWeek;
    }
    if (slot.dayOfWeek) {
        return [slot.dayOfWeek];
    }
    return [];
};

const getUserDisplayName = (user: any): string => {
    if (!user) return "Teacher";
    if (typeof user.fullName === "string" && user.fullName.trim()) return user.fullName.trim();
    if (typeof user.name === "string" && user.name.trim()) return user.name.trim();

    const fromParts = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    if (fromParts) return fromParts;

    if (typeof user.email === "string" && user.email.trim()) return user.email.trim();
    return "Teacher";
};

export default function SchedulePage() {
    const locales = useMemo(() => ({ "en-US": enUS }), []);

    const localizer = useMemo(() =>
        dateFnsLocalizer({
            format,
            parse,
            startOfWeek,
            getDay,
            locales,
        }),
        [locales]
    );

    const [date, setDate] = useState(new Date());
    const [view, setView] = useState<View>(Views.WEEK);
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCoursesCount, setActiveCoursesCount] = useState(0);

    const calendarHeight = view === Views.MONTH ? "850px" : "1100px";
    const calendarKey = `${view}-${toIsoDate(date)}-${events.length}`;

    const EventCard = ({ event }: { event?: ScheduleEvent }) => {
        if (!event) return null;
        const fallbackCourse = (event.title || "").split(" • ")[0] || "Class";
        const courseName = event.courseName || fallbackCourse;
        const timeText = event.timeText || `${format(event.start, "HH:mm")} - ${format(event.end, "HH:mm")}`;
        const roomName = event.roomName || "Not assigned";

        const tooltipString = `${courseName}\nTime: ${timeText}\nRoom: ${roomName}\nStudents: ${event.studentsText || 0}`;

        return (
            <div 
                title={tooltipString}
                className="group relative flex flex-col h-full w-full bg-[var(--color-main,indigo-600)] text-white px-2 py-1.5 rounded-lg shadow-sm border border-white/10 hover:brightness-110 active:scale-[0.99] transition-all duration-150 overflow-hidden"
                style={{ borderLeft: "4px solid rgba(255, 255, 255, 0.4)" }}
            >
                <div className="font-semibold text-[12px] leading-tight truncate mb-0.5">
                    {courseName}
                </div>
                
                <div className="flex flex-col gap-0.5 text-white/80 text-[10px]">
                    <div className="flex items-center gap-1 truncate">
                        <Clock className="w-3 h-3 min-w-3 text-white/60" />
                        <span>{timeText}</span>
                    </div>
                    {view !== Views.MONTH && (
                        <>
                            <div className="flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 min-w-3 text-white/60" />
                                <span>{roomName}</span>
                            </div>
                            <div className="flex items-center gap-1 truncate">
                                <Users className="w-3 h-3 min-w-3 text-white/60" />
                                <span>{event.studentsText} Students</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                setLoading(true);

                const userRaw = localStorage.getItem("user");
                if (!userRaw) {
                    setEvents([]);
                    return;
                }

                const user = JSON.parse(userRaw);
                const teacherId = Number(user?.id);
                const loggedInTeacherName = getUserDisplayName(user);
                if (!teacherId) {
                    setEvents([]);
                    return;
                }

                const rangeStart =
                    view === Views.DAY
                        ? startOfDay(date)
                        : view === Views.MONTH
                            ? startOfMonth(date)
                            : startOfWeek(date, { weekStartsOn: 1 });

                const rangeEnd =
                    view === Views.DAY
                        ? endOfDay(date)
                        : view === Views.MONTH
                            ? endOfMonth(date)
                            : endOfWeek(date, { weekStartsOn: 1 });

                const [teacherCourses, slotRes] = await Promise.all([
                    getTeacherCourses(teacherId),
                    api.get<CenterClassSlot[]>(`/schedule/teacher/${teacherId}/class-slots`),
                ]);

                const activeCourses = teacherCourses.filter((course) => isCourseOngoing(course.status));
                setActiveCoursesCount(activeCourses.length);

                const activeCourseIds = new Set(activeCourses.map((course) => course.id));

                if (activeCourseIds.size === 0) {
                    setEvents([]);
                    return;
                }

                const allSlots = slotRes.data || [];
                const uniqueCourseIds = Array.from(
                    new Set(
                        allSlots
                            .map((slot) => slot.course?.id)
                            .filter((id): id is number => typeof id === "number" && activeCourseIds.has(id))
                    )
                );

                const studentCountPairs = await Promise.all(
                    uniqueCourseIds.map(async (courseId) => {
                        try {
                            const students = await getStudentsInCourse(courseId);
                            return [courseId, Array.isArray(students) ? students.length : 0] as const;
                        } catch {
                            return [courseId, 0] as const;
                        }
                    })
                );
                const studentCountMap = Object.fromEntries(studentCountPairs) as Record<number, number>;

                let eventCounter = 1;
                const mappedEvents: ScheduleEvent[] = [];

                for (const slot of allSlots) {
                    const courseId = slot.course?.id;
                    if (!courseId || !activeCourseIds.has(courseId)) continue;

                    const slotStartDate = parse(slot.startDate, "yyyy-MM-dd", new Date());
                    const slotEndDate = parse(slot.endDate, "yyyy-MM-dd", new Date());

                    let current = isBefore(slotStartDate, rangeStart) ? startOfDay(rangeStart) : startOfDay(slotStartDate);
                    const effectiveEnd = isAfter(slotEndDate, rangeEnd) ? endOfDay(rangeEnd) : endOfDay(slotEndDate);

                    const daySet = new Set(getSlotDayNames(slot));
                    const excludedSet = new Set(slot.excludedDates || []);

                    while (!isAfter(current, effectiveEnd)) {
                        const isoDate = toIsoDate(current);
                        const dayMatch = Array.from(daySet).some((d) => DAY_OF_WEEK_MAP[d] === current.getDay());

                        if (dayMatch && !excludedSet.has(isoDate)) {
                            const start = combineDateAndTime(isoDate, slot.startTime || "00:00:00");
                            const end = combineDateAndTime(isoDate, slot.endTime || "00:00:00");
                            const courseName = slot.course?.name || "Class";
                            const teacherName =
                                slot.course?.teacherName ||
                                slot.course?.teacher?.fullName ||
                                slot.course?.teacher?.name ||
                                loggedInTeacherName;
                            const roomName = slot.classroom?.location || "Not assigned";
                            const timeText = `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
                            const studentsCount = slot.course?.studentCount ?? studentCountMap[slot.course?.id || 0] ?? 0;

                            mappedEvents.push({
                                id: eventCounter++,
                                title: `${courseName} • ${roomName}`,
                                start,
                                end,
                                courseName,
                                teacherName,
                                roomName,
                                timeText,
                                studentsText: String(studentsCount),
                            });
                        }
                        current = addDays(current, 1);
                    }
                }
                setEvents(mappedEvents);
            } catch (error) {
                console.error(error);
                toast.error("Unable to load teacher schedule");
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [date, view]);

    return (
        <div className="w-full h-full p-4 space-y-6 bg-transparent text-[var(--color-text)]">
            {/* Header section with Stats widgets */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--color-main)]/10 pb-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">
                        Schedule Overview
                    </h1>
                    <p className="text-sm text-[var(--color-text)]/70 mt-1">
                        Manage, review, and track your active classroom distribution timeslots.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-[var(--color-soft-white)] border border-[var(--color-main)]/20 px-4 py-2.5 rounded-xl shadow-sm">
                        <BookOpen className="w-5 h-5 text-[var(--color-main)]" />
                        <div>
                            <div className="text-[10px] uppercase font-bold text-[var(--color-text)]/60 tracking-wider">Ongoing Courses</div>
                            <div className="text-lg font-bold leading-none">{activeCoursesCount}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-[var(--color-soft-white)] border border-[var(--color-main)]/20 px-4 py-2.5 rounded-xl shadow-sm">
                        <CalendarIcon className="w-5 h-5 text-[var(--color-main)]" />
                        <div>
                            <div className="text-[10px] uppercase font-bold text-[var(--color-text)]/60 tracking-wider">Total Slots This Period</div>
                            <div className="text-lg font-bold leading-none">{events.length}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Container */}
            <div className="relative rounded-2xl border border-[var(--color-main)]/20 bg-[var(--color-soft-white)] p-5 shadow-md">
                {loading && (
                    <div className="absolute inset-0 z-50 rounded-2xl bg-[var(--color-soft-white)]/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 transition-all duration-200">
                        <Loader2 className="w-10 h-10 animate-spin text-[var(--color-main)]" />
                        <span className="text-sm font-medium">Syncing live timetable schedules...</span>
                    </div>
                )}

                <div className="schedule-calendar w-full" style={{ height: calendarHeight }}>
                    <Calendar
                        key={calendarKey}
                        localizer={localizer}
                        events={events}
                        components={{
                            event: EventCard
                        }}
                        titleAccessor={(event) => event.title}
                        formats={{
                            eventTimeRangeFormat: () => "",
                            agendaTimeRangeFormat: () => "",
                        }}
                        eventPropGetter={() => ({
                            style: {
                                padding: "2px",
                                background: "transparent",
                                border: "none"
                            },
                        })}
                        date={date}
                        view={view}
                        onNavigate={(newDate) => setDate(newDate)}
                        onView={(newView) => setView(newView)}
                        startAccessor="start"
                        endAccessor="end"
                        views={[Views.MONTH, Views.WEEK, Views.DAY]}
                        popup={true}
                    />
                </div>
            </div>

            {/* Strict Global CSS Override System applying your custom styles/variables */}
            <style jsx global>{`
                /* Hide native time markers and clean up layout elements */
                .schedule-calendar .rbc-event-label {
                    display: none !important;
                }
                .schedule-calendar .rbc-event {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                }
                .schedule-calendar .rbc-row-segment {
                    padding: 3px 5px !important;
                }
                .schedule-calendar .rbc-calendar {
                    height: 100%;
                    font-family: inherit;
                }

                /* Variable styling for buttons and controls */
                .schedule-calendar .rbc-toolbar button {
                    color: var(--color-text);
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    background-color: transparent;
                    border-radius: 8px;
                    padding: 6px 14px;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.15s ease;
                }
                .schedule-calendar .rbc-toolbar button:hover {
                    background-color: var(--color-main);
                    color: white;
                    border-color: var(--color-main);
                }
                .schedule-calendar .rbc-toolbar button.rbc-active {
                    background-color: var(--color-main);
                    color: white;
                    border-color: var(--color-main);
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
                }

                /* Grid layout border variables */
                .schedule-calendar .rbc-month-view,
                .schedule-calendar .rbc-time-view {
                    border: 1px solid rgba(0, 0, 0, 0.06) !important;
                    border-radius: 12px;
                    overflow: hidden;
                    background: white;
                }
                .schedule-calendar .rbc-header {
                    padding: 10px 0 !important;
                    font-weight: 600 !important;
                    font-size: 13px;
                    border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
                    background-color: rgba(0, 0, 0, 0.01);
                }
                .schedule-calendar .rbc-day-bg + .rbc-day-bg,
                .schedule-calendar .rbc-time-content > * + * {
                    border-left: 1px solid rgba(0, 0, 0, 0.05) !important;
                }
                .schedule-calendar .rbc-month-row + .rbc-month-row,
                .schedule-calendar .rbc-timeslot-group {
                    border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
                }

                /* Today color variable indicator ring */
                .schedule-calendar .rbc-today {
                    background-color: rgba(var(--color-main-rgb, 79, 70, 229), 0.04) !important;
                }

                /* Off-month calendar grid days variable */
                .schedule-calendar .rbc-off-range-bg {
                    background-color: rgba(0, 0, 0, 0.02) !important;
                    opacity: 0.6;
                }
            `}</style>
        </div>
    );
}