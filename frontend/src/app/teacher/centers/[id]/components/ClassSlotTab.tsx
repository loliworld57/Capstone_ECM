"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Edit2Icon, Plus, Repeat2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
    CenterClassroom,
    CenterClassSlot,
    deleteCenterClassSlot,
    deleteCenterClassSlotOccurrence,
    getCenterClassrooms,
    getCenterClassSlots,
} from "@/services/centerService";
import { getStudentsInCourse } from "@/services/courseService";
import ClassSlotModal from "./ClassSlotModal";
import ConfirmModal from "@/components/ConfirmModal";
import { DateHeader, Timeline, TimelineHeaders, TimelineItemBase } from "react-calendar-timeline";
import "react-calendar-timeline/dist/style.css";
import dayjs from "dayjs";
import { formatDateValue } from "../../../../../utils/dateFormat";

/** Maps Java DayOfWeek enum values to dayjs .day() (0 = Sunday … 6 = Saturday) */
const DAY_OF_WEEK_MAP: Record<string, number> = {
    SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
    THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
};

const TIMELINE_KEYS = {
    groupIdKey: "id",
    groupTitleKey: "title",
    groupLabelKey: "title",
    groupRightTitleKey: "rightTitle",
    itemIdKey: "id",
    itemTitleKey: "title",
    itemDivTitleKey: "title",
    itemGroupKey: "group",
    itemTimeStartKey: "start_time",
    itemTimeEndKey: "end_time",
};

const FILTER_DAY_OPTIONS = [
    "ALL",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
] as const;

const FILTER_TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const halfHourIndex = i;
    const hour24 = Math.floor(halfHourIndex / 2);
    const minute = halfHourIndex % 2 === 0 ? "00" : "30";
    const value = `${String(hour24).padStart(2, "0")}:${minute}`;
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const amPm = hour24 < 12 ? "AM" : "PM";
    return { value, label: `${hour12}:${minute} ${amPm}` };
});

function getWeekStart(d: dayjs.Dayjs): dayjs.Dayjs {
    const dow = d.day();
    return d.subtract(dow === 0 ? 6 : dow - 1, "day").startOf("day");
}

type TimelineViewMode = "week" | "day";

type TimelineDisplayItem = TimelineItemBase<number> & {
    slotId: number;
    occurrenceDate: string;
    courseId?: number;
    courseName: string;
    teacherText: string;
    studentText: string;
    timeText: string;
    daysText: string;
    rangeText: string;
    classroomText: string;
};

// Preset list of distinct Tailwind color definitions for unique slot mappings
const SLOT_COLORS = [
    { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-950", tagBg: "bg-emerald-100", tagText: "text-emerald-800" },
    { bg: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-950", tagBg: "bg-indigo-100", tagText: "text-indigo-800" },
    { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-950", tagBg: "bg-amber-100", tagText: "text-amber-800" },
    { bg: "bg-sky-50", border: "border-sky-300", text: "text-sky-950", tagBg: "bg-sky-100", tagText: "text-sky-800" },
    { bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-950", tagBg: "bg-rose-100", tagText: "text-rose-800" },
    { bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-950", tagBg: "bg-violet-100", tagText: "text-violet-800" },
    { bg: "bg-teal-50", border: "border-teal-300", text: "text-teal-950", tagBg: "bg-teal-100", tagText: "text-teal-800" },
    { bg: "bg-fuchsia-50", border: "border-fuchsia-300", text: "text-fuchsia-950", tagBg: "bg-fuchsia-100", tagText: "text-fuchsia-800" },
];

// Resolves a consistent unique color schema configuration utilizing the database Slot ID
function getColorForSlotId(id: number) {
    return SLOT_COLORS[id % SLOT_COLORS.length];
}

interface Props {
    centerId: number;
    isManager: boolean;
}

export default function ClassSlotTab({ centerId, isManager }: Props) {
    const router = useRouter();
    const slotsPerPage = 8;
    const [slots, setSlots] = useState<CenterClassSlot[]>([]);
    const [classrooms, setClassrooms] = useState<CenterClassroom[]>([]);
    const [courseStudentCounts, setCourseStudentCounts] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingSlot, setEditingSlot] = useState<CenterClassSlot | null>(null);
    const [deletingSlot, setDeletingSlot] = useState<CenterClassSlot | null>(null);
    const [viewMode, setViewMode] = useState<TimelineViewMode>("week");
    const [focusDate, setFocusDate] = useState(() => dayjs().startOf("day"));
    const [searchTerm, setSearchTerm] = useState("");
    const [dayFilter, setDayFilter] = useState<(typeof FILTER_DAY_OPTIONS)[number]>("ALL");
    const [timeFrom, setTimeFrom] = useState("00:00");
    const [timeTo, setTimeTo] = useState("23:30");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedOccurrence, setSelectedOccurrence] = useState<{
        slotId: number;
        occurrenceDate: string;
        startTime: string;
        endTime: string;
    } | null>(null);
    const [isOccurrenceActionModalOpen, setOccurrenceActionModalOpen] = useState(false);
    const [isOccurrenceEditModalOpen, setOccurrenceEditModalOpen] = useState(false);
    const [occurrenceEditSlot, setOccurrenceEditSlot] = useState<CenterClassSlot | null>(null);
    const [isDeleteOccurrenceConfirmOpen, setDeleteOccurrenceConfirmOpen] = useState(false);
    
    const isAnyOverlayOpen =
        isModalOpen ||
        isOccurrenceEditModalOpen ||
        isOccurrenceActionModalOpen ||
        isDeleteOccurrenceConfirmOpen ||
        !!deletingSlot;

    const parseUserManagerId = () => {
        const userRaw = localStorage.getItem("user");
        const user = userRaw ? JSON.parse(userRaw) : null;
        return user?.id as number | undefined;
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [slotData, roomData] = await Promise.all([
                getCenterClassSlots(centerId),
                getCenterClassrooms(centerId),
            ]);
            setSlots(slotData);
            setClassrooms(roomData);

            const uniqueCourseIds = Array.from(
                new Set(slotData.map((slot) => slot.course?.id).filter((id): id is number => typeof id === "number"))
            );

            if (uniqueCourseIds.length > 0) {
                const counts = await Promise.all(
                    uniqueCourseIds.map(async (courseId) => {
                        try {
                            const students = await getStudentsInCourse(courseId);
                            return [courseId, Array.isArray(students) ? students.length : 0] as const;
                        } catch {
                            return [courseId, 0] as const;
                        }
                    })
                );
                setCourseStudentCounts(Object.fromEntries(counts));
            } else {
                setCourseStudentCounts({});
            }
        } catch (error) {
            console.error(error);
            toast.error("Cannot load class slots.");
        } finally {
            setLoading(false);
        }
    }, [centerId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (timeFrom >= timeTo) {
            setTimeTo("23:30");
        }
    }, [timeFrom, timeTo]);

    const handleDelete = async (slot: CenterClassSlot) => {
        const managerId = parseUserManagerId();
        if (!managerId) {
            toast.error("Cannot identify manager. Please login again.");
            return;
        }

        try {
            await deleteCenterClassSlot(centerId, slot.id, managerId);
            toast.success("Class slot deleted.");
            setDeletingSlot(null);
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Could not delete class slot.");
        }
    };

    const filteredSlots = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return slots.filter((slot) => {
            const courseName = slot.course?.name?.toLowerCase() || "";
            const roomName = slot.classroom?.location?.toLowerCase() || "";
            const searchMatch = !normalizedSearch || courseName.includes(normalizedSearch) || roomName.includes(normalizedSearch);
            const dayMatch = dayFilter === "ALL" || (slot.daysOfWeek || []).includes(dayFilter);
            const slotStart = slot.startTime?.slice(0, 5) || "00:00";
            const slotEnd = slot.endTime?.slice(0, 5) || "00:00";
            const timeMatch = slotStart < timeTo && timeFrom < slotEnd;

            return searchMatch && dayMatch && timeMatch;
        });
    }, [slots, searchTerm, dayFilter, timeFrom, timeTo]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dayFilter, timeFrom, timeTo, slots]);

    const totalPages = Math.max(1, Math.ceil(filteredSlots.length / slotsPerPage));

    const paginatedSlots = useMemo(() => {
        const startIndex = (currentPage - 1) * slotsPerPage;
        return filteredSlots.slice(startIndex, startIndex + slotsPerPage);
    }, [filteredSlots, currentPage]);

    const hasUnassignedClassroomSlots = useMemo(
        () => filteredSlots.some((slot) => !slot.classroom?.id),
        [filteredSlots]
    );

    const timelineGroups = useMemo(
        () => [
            ...classrooms.map((c) => ({ id: c.id, title: c.location })),
            ...(hasUnassignedClassroomSlots ? [{ id: 0, title: "No Classroom" }] : []),
        ],
        [classrooms, hasUnassignedClassroomSlots]
    );

    const timelineItems = useMemo(() => {
        let counter = 1;
        return filteredSlots.flatMap((slot) => {
            const groupId = slot.classroom?.id ?? 0;
            const [startH, startM] = slot.startTime.split(":").map(Number);
            const [endH, endM] = slot.endTime.split(":").map(Number);
            const dateEnd = dayjs(slot.endDate);
            const items: TimelineDisplayItem[] = [];
            let current = dayjs(slot.startDate);
            while (!current.isAfter(dateEnd)) {
                if (slot.daysOfWeek.some((d) => DAY_OF_WEEK_MAP[d] === current.day())) {
                    const occurrenceDate = current.format("YYYY-MM-DD");
                    if (slot.excludedDates?.includes(occurrenceDate)) {
                        current = current.add(1, "day");
                        continue;
                    }

                    const courseName = slot.course?.name || "Class";
                    const teacherName =
                        slot.course?.teacherName ||
                        slot.course?.teacher?.fullName ||
                        slot.course?.teacher?.name ||
                        "Not assigned";
                    const studentCount = slot.course?.studentCount ?? (slot.course?.id ? courseStudentCounts[slot.course.id] : undefined);
                    const timeText = `${slot.startTime?.slice(0, 5)} - ${slot.endTime?.slice(0, 5)}`;
                    const daysText = `Days: ${(slot.daysOfWeek || []).join(", ") || "-"}`;
                    const rangeText = `Range: ${formatDateValue(slot.startDate)} -> ${formatDateValue(slot.endDate)}`;
                    const classroomText = `${slot.classroom?.location || "Not assigned"}`;

                    items.push({
                        id: counter++,
                        slotId: slot.id,
                        occurrenceDate,
                        group: groupId,
                        title: courseName,
                        start_time: current.hour(startH).minute(startM).second(0).valueOf(),
                        end_time: current.hour(endH).minute(endM).second(0).valueOf(),
                        canMove: false,
                        canResize: false,
                        courseId: slot.course?.id,
                        courseName,
                        teacherText: teacherName,
                        studentText: `Students: ${studentCount ?? 0}`,
                        timeText,
                        daysText,
                        rangeText,
                        classroomText,
                    });
                }
                current = current.add(1, "day");
            }
            return items;
        });
    }, [filteredSlots, courseStudentCounts]);

    const courseIdByItemId = useMemo(() => {
        const map = new Map<string, number>();
        timelineItems.forEach((item) => {
            if (item.courseId) map.set(String(item.id), item.courseId);
        });
        return map;
    }, [timelineItems]);

    const occurrenceByItemId = useMemo(() => {
        const map = new Map<string, { slotId: number; occurrenceDate: string; startTime: string; endTime: string }>();
        timelineItems.forEach((item) => {
            map.set(String(item.id), {
                slotId: item.slotId,
                occurrenceDate: item.occurrenceDate,
                startTime: dayjs(item.start_time).format("HH:mm"),
                endTime: dayjs(item.end_time).format("HH:mm"),
            });
        });
        return map;
    }, [timelineItems]);

    const weekStart = useMemo(() => getWeekStart(focusDate), [focusDate]);

    // Enhanced time window visibility calculations that widen the Day view viewport layout
    const visibleStart = useMemo(() => {
        if (viewMode === "day") {
            // Cuts down canvas bounds to a tight readable morning focus window to amplify visual width size
            return focusDate.startOf("day").hour(7).valueOf();
        }
        return weekStart.startOf("day").hour(7).valueOf();
    }, [viewMode, focusDate, weekStart]);

    const visibleEnd = useMemo(() => {
        if (viewMode === "day") {
            // Restricts the viewport timeline frame, extending horizontal width metrics on items
            return focusDate.startOf("day").hour(22).valueOf();
        }
        return weekStart.add(6, "day").endOf("day").hour(22).valueOf();
    }, [viewMode, focusDate, weekStart]);

    const handleTimeChange = useCallback(
        (_vs: number, _ve: number, updateScrollCanvas: (...args: any[]) => void) => {
            updateScrollCanvas(visibleStart, visibleEnd);
        },
        [visibleStart, visibleEnd]
    );

    const prevPeriod = () => {
        setFocusDate((d) => d.subtract(viewMode === "day" ? 1 : 7, "day"));
    };

    const nextPeriod = () => {
        setFocusDate((d) => d.add(viewMode === "day" ? 1 : 7, "day"));
    };

    const onDatePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            setFocusDate(dayjs(e.target.value).startOf("day"));
        }
    };

    const periodLabel =
        viewMode === "day"
            ? focusDate.format("MMM D, YYYY")
            : `${weekStart.format("MMM D")} - ${weekStart.add(6, "day").format("MMM D, YYYY")}`;

    const handleItemDoubleClick = useCallback(
        (itemId: number | string) => {
            const courseId = courseIdByItemId.get(String(itemId));
            if (!courseId) {
                toast.error("Course is not available for this slot.");
                return;
            }
            router.push(`/teacher/courses/${courseId}`);
        },
        [courseIdByItemId, router]
    );

    const handleItemClick = useCallback(
        async (itemId: number | string) => {
            // Click to view detail is preserved completely via opening details modal overlay
            if (isAnyOverlayOpen) return;
            const occurrence = occurrenceByItemId.get(String(itemId));
            if (!occurrence) return;

            setSelectedOccurrence(occurrence);
            setOccurrenceActionModalOpen(true);
        },
        [isAnyOverlayOpen, occurrenceByItemId]
    );

    const handleEditWholeSeries = useCallback(() => {
        if (!selectedOccurrence) return;
        const slot = slots.find((s) => s.id === selectedOccurrence.slotId);
        if (!slot) {
            toast.error("Cannot find slot to edit.");
            return;
        }
        setOccurrenceActionModalOpen(false);
        setEditingSlot(slot);
        setModalOpen(true);
    }, [selectedOccurrence, slots]);

    const handleOpenOverrideModal = useCallback(() => {
        if (!selectedOccurrence) return;
        const slot = slots.find((s) => s.id === selectedOccurrence.slotId);
        if (!slot) {
            toast.error("Cannot find slot to edit.");
            return;
        }
        setOccurrenceActionModalOpen(false);
        setOccurrenceEditSlot(slot);
        setOccurrenceEditModalOpen(true);
    }, [selectedOccurrence, slots]);

    const handleDeleteSelectedOccurrence = useCallback(() => {
        if (!selectedOccurrence) return;
        setOccurrenceActionModalOpen(false);
        setDeleteOccurrenceConfirmOpen(true);
    }, [selectedOccurrence]);

    const confirmDeleteSelectedOccurrence = useCallback(async () => {
        if (!selectedOccurrence) return;
        const managerId = parseUserManagerId();
        if (!managerId) {
            toast.error("Cannot identify manager. Please login again.");
            return;
        }

        try {
            await deleteCenterClassSlotOccurrence(centerId, selectedOccurrence.slotId, selectedOccurrence.occurrenceDate, managerId);
            toast.success("Selected occurrence deleted.");
            setDeleteOccurrenceConfirmOpen(false);
            setSelectedOccurrence(null);
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Could not delete selected occurrence.");
        }
    }, [centerId, fetchData, selectedOccurrence]);

    const dayPrimaryHeaderLabel = useCallback((timeRange: [dayjs.Dayjs, dayjs.Dayjs]) => {
        return timeRange[0].format("dddd, MMM D, YYYY");
    }, []);

    const dayTimeHeaderLabel = useCallback((timeRange: [dayjs.Dayjs, dayjs.Dayjs]) => {
        return timeRange[0].format("hh:mm A");
    }, []);

    const renderTimelineItem = useCallback(
        ({ item, getItemProps, itemContext }: any) => {
            const displayItem = item as TimelineDisplayItem;
            
            // Fetch dynamically computed unique background and boundary styles for this specific slot ID rule
            const colorScheme = getColorForSlotId(displayItem.slotId);

            const itemProps = getItemProps({
                className: "group !bg-transparent !border-0 !shadow-none !text-inherit cursor-pointer overflow-visible",
            });
            const { key, ...restItemProps } = itemProps;

            return (
                <div key={key} {...restItemProps} onClick={() => handleItemClick(displayItem.id)}>
                    <div
                        className={`h-full w-full rounded-xl border-2 p-2.5 leading-tight transition-all group-hover:shadow-md flex flex-col justify-between overflow-hidden whitespace-normal break-words ${colorScheme.bg} ${colorScheme.border} ${colorScheme.text} ${
                            itemContext.dragging ? "opacity-70" : "opacity-100"
                        }`}
                    >
                        <div>
                            <div className="font-bold text-sm line-clamp-1">{displayItem.courseName}</div>
                            <div className="text-xs opacity-80 font-medium truncate mt-0.5">{displayItem.teacherText}</div>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1">
                            <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-semibold ${colorScheme.tagBg} ${colorScheme.tagText}`}>
                                <Clock3 size={11} />
                                <span>{displayItem.timeText}</span>
                            </div>
                            <div className="text-[10px] font-bold opacity-60 truncate">
                                {displayItem.classroomText}
                            </div>
                        </div>
                    </div>
                </div>
            );
        },
        [handleItemClick]
    );

    if (loading) {
        return (
            <div className="flex h-60 flex-col items-center justify-center gap-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
                <p className="text-sm font-medium text-slate-500">Loading schedules...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-1">
            <ClassSlotModal
                centerId={centerId}
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={fetchData}
                slot={editingSlot}
                classrooms={classrooms}
            />

            <ClassSlotModal
                centerId={centerId}
                isOpen={isOccurrenceEditModalOpen}
                onClose={() => {
                    setOccurrenceEditModalOpen(false);
                    setOccurrenceEditSlot(null);
                }}
                onSuccess={() => {
                    setOccurrenceEditModalOpen(false);
                    setOccurrenceEditSlot(null);
                    setSelectedOccurrence(null);
                    fetchData();
                }}
                slot={occurrenceEditSlot}
                classrooms={classrooms}
                mode="occurrence"
                occurrenceDate={selectedOccurrence?.occurrenceDate}
                occurrenceSlotId={selectedOccurrence?.slotId}
                occurrenceStartTime={selectedOccurrence?.startTime}
                occurrenceEndTime={selectedOccurrence?.endTime}
                lockCourse
            />

            <ConfirmModal
                isOpen={!!deletingSlot}
                title="Delete Class Slot"
                message={`Are you sure you want to delete the class slot for "${deletingSlot?.course?.name || "this course"}"?`}
                confirmText="Delete"
                onClose={() => setDeletingSlot(null)}
                onConfirm={() => (deletingSlot ? handleDelete(deletingSlot) : undefined)}
            />

            <ConfirmModal
                isOpen={isDeleteOccurrenceConfirmOpen}
                title="Delete Selected Occurrence"
                message={`Are you sure you want to delete only the occurrence on ${selectedOccurrence ? formatDateValue(selectedOccurrence.occurrenceDate) : "this date"}?`}
                confirmText="Delete Specific Instance"
                onClose={() => setDeleteOccurrenceConfirmOpen(false)}
                onConfirm={confirmDeleteSelectedOccurrence}
            />

            {isOccurrenceActionModalOpen && selectedOccurrence && (
                <div className="fixed inset-0 z-[2000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 p-6 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-2">
                                    <Clock3 size={12} /> View Slot Details
                                </span>
                                <h3 className="text-lg font-bold text-slate-900">Manage Slot Occurrence</h3>
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100 space-y-1.5 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">Date:</span><span className="font-semibold text-slate-800">{formatDateValue(selectedOccurrence.occurrenceDate)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Time Window:</span><span className="font-semibold text-slate-800">{selectedOccurrence.startTime} - {selectedOccurrence.endTime}</span></div>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 mb-4">
                            <button
                                onClick={handleOpenOverrideModal}
                                className="w-full px-4 py-2.5 bg-white text-slate-700 font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition text-sm text-left shadow-sm flex items-center justify-between group"
                            >
                                <span>Edit single event details</span>
                                <span className="text-xs font-normal text-slate-400 group-hover:text-slate-600">This instance only →</span>
                            </button>

                            <button
                                onClick={handleEditWholeSeries}
                                className="w-full px-4 py-2.5 bg-white text-indigo-600 font-semibold border border-indigo-100 rounded-xl hover:bg-indigo-50/50 transition text-sm text-left shadow-sm flex items-center justify-between group"
                            >
                                <span>Modify entire recurrence series</span>
                                <span className="text-xs font-normal text-indigo-400 group-hover:text-indigo-600">All dates →</span>
                            </button>

                            <button
                                onClick={handleDeleteSelectedOccurrence}
                                className="w-full px-4 py-2.5 bg-red-50 text-red-600 font-semibold border border-red-100 rounded-xl hover:bg-red-100 transition text-sm text-left flex items-center justify-between group"
                            >
                                <span>Cancel this occurrence</span>
                                <Trash2 size={15} className="text-red-400 group-hover:text-red-600" />
                            </button>
                        </div>

                        <button
                            onClick={() => setOccurrenceActionModalOpen(false)}
                            className="w-full text-center py-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition"
                        >
                            Close Detail View
                        </button>
                    </div>
                </div>
            )}

            {/* Header section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <div className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
                            <CalendarDays size={20} />
                        </div> 
                        Active Cohorts & Time Slots
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Configure systemic timetables, recurring tracks, and standalone overrides.</p>
                </div>

                {isManager && (
                    <button
                        onClick={() => {
                            setEditingSlot(null);
                            setModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 shadow-sm hover:shadow active:scale-[0.98] transition-all"
                    >
                        <Plus size={16} /> New Class Slot
                    </button>
                )}
            </div>

            {/* Filters Hub Panel */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Find by class or venue room..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                    />

                    <select
                        value={dayFilter}
                        onChange={(e) => setDayFilter(e.target.value as (typeof FILTER_DAY_OPTIONS)[number])}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 cursor-pointer text-slate-700"
                    >
                        {FILTER_DAY_OPTIONS.map((day) => (
                            <option key={day} value={day}>
                                {day === "ALL" ? "Every Available Day" : day}
                            </option>
                        ))}
                    </select>

                    <select
                        value={timeFrom}
                        onChange={(e) => setTimeFrom(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 cursor-pointer text-slate-600"
                    >
                        {FILTER_TIME_OPTIONS.filter((opt) => opt.value < "23:30").map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                Starting from {opt.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={timeTo}
                        onChange={(e) => setTimeTo(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 cursor-pointer text-slate-600"
                    >
                        {FILTER_TIME_OPTIONS.filter((opt) => opt.value > timeFrom).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                Concluding by {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {slots.length === 0 ? (
                <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white-500">
                    <p className="text-base font-semibold text-slate-700">No active blocks configured</p>
                </div>
            ) : filteredSlots.length === 0 ? (
                <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white-500">
                    <p className="text-base font-semibold text-slate-600">Zero timeline collisions matched</p>
                </div>
            ) : (
                <>
                    {/* Grid Cards Catalog */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {paginatedSlots.map((slot) => (
                            <div
                                key={slot.id}
                                className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="p-5 flex-1">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="font-bold text-slate-800 text-[15px] leading-snug line-clamp-2">
                                            {slot.course?.name || "Untitled Course Map"}
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-xs font-medium text-slate-500">
                                        <div className="flex items-center gap-2 text-slate-700 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                                            <Clock3 size={13} className="text-slate-400" />
                                            <span className="font-semibold">{slot.startTime?.slice(0, 5)} - {slot.endTime?.slice(0, 5)}</span>
                                        </div>
                                        <div className="bg-slate-50/60 rounded-lg px-3 py-1.5 border border-slate-100/50 truncate">
                                            Days: {(slot.daysOfWeek || []).join(", ")}
                                        </div>
                                        <div className="bg-slate-50/60 rounded-lg px-3 py-1.5 border border-slate-100/50 truncate">
                                            Classroom: {slot.classroom?.location || "Not assigned"}
                                        </div>
                                    </div>
                                </div>

                                {isManager && (
                                    <div className="flex items-center gap-1 border-t border-slate-100 bg-slate-50/50 p-2.5 px-3 justify-end">
                                        <button
                                            onClick={() => {
                                                setEditingSlot(slot);
                                                setModalOpen(true);
                                            }}
                                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition"
                                        >
                                            <Edit2Icon size={15} />
                                        </button>
                                        <button
                                            onClick={() => setDeletingSlot(slot)}
                                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pagination control footer bar */}
                    {filteredSlots.length > slotsPerPage && (
                        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs font-semibold text-slate-500">
                                Displaying records <span className="text-slate-800">{(currentPage - 1) * slotsPerPage + 1}</span> to{" "}
                                <span className="text-slate-800">{Math.min(currentPage * slotsPerPage, filteredSlots.length)}</span> of{" "}
                                <span className="text-slate-800">{filteredSlots.length}</span> entries
                            </p>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                    disabled={currentPage === 1}
                                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                                >
                                    Prev
                                </button>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl text-center">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                    disabled={currentPage === totalPages}
                                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Schedule Workspace Canvas layout */}
                    <div className={`rounded-2xl overflow-hidden border border-slate-200 shadow-md relative bg-white z-0 ${isAnyOverlayOpen ? "pointer-events-none select-none opacity-50" : ""}`}>
                        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between gap-4 flex-wrap select-none">
                            <div className="flex items-center gap-3">
                                <CalendarDays size={16} className="text-emerald-400" />
                                <span className="text-sm font-bold tracking-tight">Interactive Layout Workspace</span>
                                
                                <div className="flex items-center bg-white/10 rounded-lg p-0.5 ml-2">
                                    <button
                                        onClick={() => setViewMode("day")}
                                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                            viewMode === "day" ? "bg-white text-slate-900 shadow-sm" : "text-slate-300 hover:text-white"
                                        }`}
                                    >
                                        Day
                                    </button>
                                    <button
                                        onClick={() => setViewMode("week")}
                                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                            viewMode === "week" ? "bg-white text-slate-900 shadow-sm" : "text-slate-300 hover:text-white"
                                        }`}
                                    >
                                        Week
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center bg-white/10 rounded-lg border border-white/5 overflow-hidden">
                                    <button onClick={prevPeriod} className="p-1.5 hover:bg-white/10 text-white/80"><ChevronLeft size={16} /></button>
                                    <span className="text-xs font-bold px-3 min-w-[150px] text-center text-slate-100">{periodLabel}</span>
                                    <button onClick={nextPeriod} className="p-1.5 hover:bg-white/10 text-white/80"><ChevronRight size={16} /></button>
                                </div>
                                <input
                                    type="date"
                                    onChange={onDatePick}
                                    className="text-xs font-bold text-slate-800 bg-white rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="w-full overflow-x-auto bg-white">
                            {/* Adjusted structural frame dimensions for day vs week mode */}
                            <div className={viewMode === "day" ? "min-w-[1500px]" : "min-w-[2400px]"}>
                                <Timeline
                                    groups={timelineGroups}
                                    items={timelineItems}
                                    selected={[]}
                                    keys={TIMELINE_KEYS}
                                    defaultTimeStart={visibleStart}
                                    defaultTimeEnd={visibleEnd}
                                    visibleTimeStart={visibleStart}
                                    visibleTimeEnd={visibleEnd}
                                    onTimeChange={handleTimeChange}
                                    onItemClick={handleItemClick}
                                    onItemDoubleClick={handleItemDoubleClick}
                                    itemRenderer={renderTimelineItem}
                                    sidebarWidth={180}
                                    lineHeight={92}
                                    itemHeightRatio={0.88}
                                    stackItems
                                    canMove={false}
                                    canResize={false}
                                    canSelect={false}
                                    dragSnap={15 * 60 * 1000}
                                >
                                    <TimelineHeaders>
                                        <DateHeader unit="primaryHeader" labelFormat={dayPrimaryHeaderLabel} className="bg-slate-50 text-slate-800 font-bold border-b" />
                                        <DateHeader unit={viewMode === "day" ? "hour" : "day"} labelFormat={viewMode === "day" ? dayTimeHeaderLabel : undefined} className="bg-white text-slate-500 text-xs" />
                                    </TimelineHeaders>
                                </Timeline>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}