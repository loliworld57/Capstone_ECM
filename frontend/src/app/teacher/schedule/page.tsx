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
    const locales = useMemo(
        () => ({
            "en-US": enUS,
        }),
        []
    );

    const localizer = useMemo(
        () =>
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
    const calendarHeightClass = view === Views.MONTH ? "min-h-[900px]" : "h-[1800px]";

    // Force react-big-calendar to recalculate layout when switching views/dates.
    const calendarKey = `${view}-${toIsoDate(date)}-${events.length}`;


    const EventCard = ({ event }: { event?: ScheduleEvent }) => {
        const titleParts = (event?.title || "").split(" • ");

        const fallbackCourse = titleParts[0] || "Class";
        const fallbackRoom = titleParts[1] || "Not assigned";
        const courseName = event?.courseName || fallbackCourse;
        const teacherName = event?.teacherName || "Not assigned";
        const roomName = event?.roomName || fallbackRoom;
        const timeText = event?.timeText || (event?.start && event?.end
            ? `${format(event.start, "HH:mm")} - ${format(event.end, "HH:mm")}`
            : "N/A");
        const studentsText = event?.studentsText || "0";

        return (
                        <div className="group relative h-full w-full bg-[var(--color-main)]/90 border border-white/20 p-1 rounded-sm cursor-pointer transition-colors hover:bg-[var(--color-main)]">

                {/* 1. VISIBLE CONTENT (Short & truncated to fit small blocks) */}
                <div className="font-bold text-white text-[11px] leading-tight truncate">
                    {courseName}
                </div>
                <div className="text-white/80 text-[10px] truncate mt-0.5">
                    {timeText}
                </div>


                {/* 2. HOVER POP-UP (Tooltip) */}
                <div className="pointer-events-none absolute left-full top-0 ml-2 w-56 opacity-0 transition-opacity group-hover:opacity-100 z-[9999] bg-white text-gray-800 shadow-xl border border-gray-200 rounded-lg p-3 text-xs hidden sm:block">
                    <div className="font-bold text-[var(--color-main)] text-sm mb-2 border-b border-gray-100 pb-1">
                        {courseName}
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between">
                            <span className="text-gray-500 font-semibold">Teacher:</span>
                            <span className="font-medium text-right">{teacherName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 font-semibold">Students:</span>
                            <span className="font-medium">{studentsText}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 font-semibold">Time:</span>
                            <span className="font-medium">{timeText}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 font-semibold">Room:</span>
                            <span className="font-medium">{roomName}</span>
                        </div>
                    </div>
                    {/* Arrow pointing left */}
                    <div className="absolute top-3 -left-1.5 w-3 h-3 bg-white border-l border-b border-gray-200 transform rotate-45"></div>
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

                // FIX: Changed startOfDay(date) to endOfDay(date) to prevent calculations looping out of bounds in horizontal grids
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

                const activeCourseIds = new Set(
                    teacherCourses
                        .filter((course) => isCourseOngoing(course.status))
                        .map((course) => course.id)
                );

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

                    let current = isBefore(slotStartDate, rangeStart) ? rangeStart : slotStartDate;
                    const effectiveEnd = isAfter(slotEndDate, rangeEnd) ? rangeEnd : slotEndDate;

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
                                [slot.course?.teacher?.firstName, slot.course?.teacher?.lastName]
                                    .filter(Boolean)
                                    .join(" ") ||
                                loggedInTeacherName;
                            const roomName = slot.classroom?.location || "Not assigned";
                            const timeText = `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
                            const studentsCount =
                                slot.course?.studentCount ??
                                slot.course?.totalStudents ??
                                slot.course?.totalStudent ??
                                slot.course?.numberOfStudents ??
                                (Array.isArray(slot.course?.students) ? slot.course?.students.length : undefined) ??
                                (slot.course?.id ? studentCountMap[slot.course.id] : undefined);

                            mappedEvents.push({
                                id: eventCounter++,
                                title: `${courseName} • ${roomName}`,
                                start,
                                end,
                                courseName,
                                teacherName,
                                roomName,
                                timeText,
                                studentsText: studentsCount != null ? String(studentsCount) : "0",
                            });
                        }

                        current = addDays(current, 1);
                    }
                }
                console.log("Mapped events:", mappedEvents);
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

    useEffect(() => {
        console.log("Events changed:", events);
        console.log("Current calendar date:", date);
        console.log("Current view:", view);
    }, [events]);

    return (
        <div>
            <h1 className="mb-4 text-2xl font-bold text-[var(--color-text)]">
                Schedule
            </h1>

            <div className="rounded-xl border border-[var(--color-main)] bg-[var(--color-soft-white)] p-4 shadow-sm">
                {loading && (
                    <div className="mb-3 text-sm text-[var(--color-text)]">Loading active classes...</div>
                )}
            <div className={`schedule-calendar ${calendarHeightClass}`}>
                    <Calendar
                        key={calendarKey}
                        localizer={localizer}

                        events={events}
                        components={{
                            event: EventCard,
                            month: { event: EventCard },
                            week: { event: EventCard },
                            day: { event: EventCard },
                        }}
                        // Simply pass the valid title string so internal grid layouts calculate properly
                        titleAccessor={(event) => event.title}
                        formats={{
                            eventTimeRangeFormat: () => "",
                            agendaTimeRangeFormat: () => "",
                        }}
                        eventPropGetter={() => ({
                            style: {
                                padding: 0,
                                border: "none",
                                minHeight: view === Views.MONTH ? 88 : undefined,
                                background: "transparent",
                            },
                        })}
                        date={date}
                        view={view}
                        onNavigate={(newDate) => setDate(newDate)}
                        onView={(newView) => setView(newView)}
                        startAccessor="start"
                        endAccessor="end"
                        views={[Views.MONTH, Views.WEEK, Views.DAY]}
                        min={new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)}
                        max={new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)}

                        popup
                    />
                </div>
            </div>

            <style jsx global>{`
    /* Hide the default time label inside the event */
    .schedule-calendar,
    .schedule-calendar .rbc-calendar {
        height: 100%;
    }

    .schedule-calendar .rbc-time-view,
    .schedule-calendar .rbc-month-view,
    .schedule-calendar .rbc-agenda-view {
        height: 100%;
    }

    .schedule-calendar .rbc-time-content,
    .schedule-calendar .rbc-time-view,
    .schedule-calendar .rbc-month-view {
        overflow: visible !important;
    }

    .schedule-calendar .rbc-event-label {
        display: none;
    }


    /* IMPORTANT: Allow the hover pop-up to escape the calendar block */
    .schedule-calendar .rbc-event {
        box-shadow: none;
        padding: 0;
        overflow: visible !important;
        background: transparent !important;
        border: none !important;
    }

    .schedule-calendar .rbc-event-content {
        height: 100%;
        overflow: visible !important;
    }
`}</style>
        </div>
    );
}