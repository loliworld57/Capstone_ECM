"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
    AttendanceStatus,
    AttendanceSheetStudentRow,
    CourseSession,
    getAttendanceList,
    getAttendanceSheet,
    getCourseSessions,
    saveAttendance,
} from "@/services/attendanceService";
import { formatDateValue } from "@/utils/dateFormat";
import { 
    Calendar, 
    Lock, 
    Unlock, 
    Check, 
    Users, 
    AlertCircle, 
    Loader2, 
    Edit2Icon
} from "lucide-react";

interface Props {
    courseId: number;
}

const STATUS_OPTIONS: AttendanceStatus[] = ["ATTEND", "ABSENT", "LATE", "EXCUSE"];

const STATUS_LABELS: Record<AttendanceStatus, string> = {
    ATTEND: "Attend",
    ABSENT: "Absent",
    LATE: "Late",
    EXCUSE: "Excuse",
};

// Styling mapping for custom semantic status badges/buttons
const STATUS_STYLES: Record<AttendanceStatus, { active: string; border: string; text: string }> = {
    ATTEND: {
        active: "bg-emerald-600 text-white border-emerald-600 font-medium",
        border: "border-zinc-200 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200",
        text: "text-emerald-700"
    },
    ABSENT: {
        active: "bg-rose-600 text-white border-rose-600 font-medium",
        border: "border-zinc-200 text-zinc-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200",
        text: "text-rose-700"
    },
    LATE: {
        active: "bg-amber-500 text-white border-amber-500 font-medium",
        border: "border-zinc-200 text-zinc-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200",
        text: "text-amber-700"
    },
    EXCUSE: {
        active: "bg-sky-600 text-white border-sky-600 font-medium",
        border: "border-zinc-200 text-zinc-600 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200",
        text: "text-sky-700"
    },
};

export default function CourseAttendance({ courseId }: Props) {
    const [sessions, setSessions] = useState<CourseSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<number | "">("");
    const [rows, setRows] = useState<AttendanceSheetStudentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isChecklistLocked, setIsChecklistLocked] = useState(false);

    const fetchSessions = async (targetSessionId?: number) => {
        try {
            setLoading(true);
            const data = await getCourseSessions(courseId);
            setSessions(data);

            if (targetSessionId && data.some((s) => s.id === targetSessionId)) {
                setSelectedSessionId(targetSessionId);
                return;
            }

            if (data.length > 0) {
                setSelectedSessionId(data[0].id);
            } else {
                setSelectedSessionId("");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.error || "Cannot load sessions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [courseId]);

    useEffect(() => {
        if (!selectedSessionId) {
            setRows([]);
            return;
        }

        const fetchSheet = async () => {
            try {
                setLoading(true);
                const [sheet, attendance] = await Promise.all([
                    getAttendanceSheet(Number(selectedSessionId)),
                    getAttendanceList(Number(selectedSessionId)),
                ]);
                setRows(sheet.students || []);
                setIsChecklistLocked((attendance || []).length > 0);
            } catch (error: any) {
                console.error(error);
                toast.error(error?.response?.data?.error || "Cannot load attendance sheet.");
            } finally {
                setLoading(false);
            }
        };

        fetchSheet();
    }, [selectedSessionId]);

    const selectedSession = useMemo(
        () => sessions.find((s) => s.id === Number(selectedSessionId)) || null,
        [sessions, selectedSessionId]
    );

    const setStatusForStudent = (studentId: number, status: AttendanceStatus) => {
        if (isChecklistLocked) return;

        setRows((prev) =>
            prev.map((row) => (row.studentId === studentId ? { ...row, status } : row))
        );
    };

    const markAll = (status: AttendanceStatus) => {
        if (isChecklistLocked) return;

        setRows((prev) => prev.map((row) => ({ ...row, status })));
    };

    const handleSave = async () => {
        if (!selectedSessionId) {
            toast.error("Please select a session first.");
            return;
        }

        try {
            setSaving(true);
            await saveAttendance({
                classSessionId: Number(selectedSessionId),
                studentStatuses: rows.map((row) => ({
                    studentId: row.studentId,
                    status: row.status,
                    note: row.note,
                })),
            });
            toast.success("Attendance saved successfully.");
            setIsChecklistLocked(true);
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.error || "Cannot save attendance.");
        } finally {
            setSaving(false);
        }
    };

    // Loading layout placeholder skeletons
    if (loading && sessions.length === 0) {
        return (
            <div className="space-y-4 animate-pulse p-2 m-2">
                <div className="h-10 w-64 bg-zinc-200 rounded-lg" />
                <div className="h-16 w-full bg-zinc-100 rounded-xl" />
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <div className="h-12 bg-zinc-50 border-b border-zinc-200" />
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 bg-white border-b border-zinc-100 last:border-none" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 m-4">
            {/* Session Toolbar Dropdown */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full max-w-md">
                    <label htmlFor="session-select" className="sr-only">Select Session</label>
                    <select
                        id="session-select"
                        value={selectedSessionId}
                        onChange={(e) => setSelectedSessionId(e.target.value ? Number(e.target.value) : "")}
                        className="w-full h-11 rounded-xl border border-zinc-200 bg-white p-2 pr-10 text-sm font-medium text-[var(--color-text)] shadow-sm transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
                    >
                        <option value="">Select a classroom session</option>
                        {sessions.map((session) => (
                            <option key={session.id} value={session.id}>
                                {formatDateValue(session.date)} • {session.startTime?.slice(0, 5)} - {session.endTime?.slice(0, 5)}
                                {session.classroomLocation ? ` (${session.classroomLocation})` : ""}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Session Summary Card Panel */}
            {selectedSession && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[var(--color-main)] p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-white rounded-lg border border-zinc-200 text-[var(--color-main)] hidden sm:block">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-[var(--color-main)] uppercase tracking-wider">Active Session</span>
                            <h3 className="text-sm font-semibold text-zinc-800 mt-0.5">
                                {formatDateValue(selectedSession.date)} <span className="text-[var(--color-text)] font-normal">|</span> {selectedSession.startTime?.slice(0, 5)} - {selectedSession.endTime?.slice(0, 5)}
                            </h3>
                            {selectedSession.classroomLocation && (
                                <p className="text-xs text-[var(--color-text)] mt-0.5">Location: {selectedSession.classroomLocation}</p>
                            )}
                        </div>
                    </div>

                    {/* Locking Action Banner */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                        {isChecklistLocked ? (
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-positive)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-positive)] border border-[var(--color-positive)]"> Saved</span>
                                <button
                                    type="button"
                                    onClick={() => setIsChecklistLocked(false)}
                                    className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-[var(--color-main)] shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 active:scale-[0.98]"
                                >
                                    <Edit2Icon className="w-3.5 h-3.5" /> Edit
                                </button>
                            </div>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-500 border border-red">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" /> Unsaved Changes
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Empty States Handling */}
            {rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-12 px-4 text-center">
                    <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-400 mb-3">
                        {sessions.length === 0 ? <AlertCircle className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-800">No attendance records</h3>
                    <p className="text-xs text-zinc-500 max-w-xs mt-1">
                        {sessions.length === 0 
                            ? "There are no scheduled active class slots available for this course yet." 
                            : "No student assignments found attached to this active roster."}
                    </p>
                </div>
            ) : (
                /* Attendance Grid Table */
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-fixed text-sm border-collapse">
                            <thead>
                                <tr className="bg-[var(--color-main)] border-b border-zinc-200">
                                    <th className="w-1/3 px-4 py-3.5 text-left font-semibold text-white">Student Profile</th>
                                    {STATUS_OPTIONS.map((status) => (
                                        <th key={status} className="px-3 py-3.5 text-center font-medium">
                                            <button
                                                type="button"
                                                onClick={() => markAll(status)}
                                                disabled={isChecklistLocked}
                                                className="inline-flex items-center justify-center h-7 px-2.5 rounded-xl text-sm font-semibold border-2 border-white bg-white text-[var(--color-text)] shadow-sm transition hover:bg-[var(--color-main)]/20 hover:text-white hover:border-white disabled:opacity-40 disabled:hover:bg-white select-none whitespace-nowrap"
                                            >
                                                {STATUS_LABELS[status]} All
                                            </button>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                                {rows.map((row) => (
                                    <tr key={row.studentId} className="hover:bg-zinc-50/50 transition-colors">
                                        {/* Profile cell info */}
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-[var(--color-text)] truncate">
                                                {row.lastName} {row.firstName}
                                            </div>
                                            <div className="text-xs text-[var(--color-text)] font-normal truncate mt-0.5">
                                                {row.email || "No email assigned"}
                                            </div>
                                        </td>
                                        
                                        {/* Functional Custom Status Buttons */}
                                        {STATUS_OPTIONS.map((status) => {
                                            const isSelected = row.status === status;
                                            const currentStyle = STATUS_STYLES[status];
                                            
                                            return (
                                                <td key={status} className="px-2 py-3 text-center whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        disabled={isChecklistLocked}
                                                        onClick={() => setStatusForStudent(row.studentId, status)}
                                                        className={`inline-flex items-center justify-center gap-1 w-24 h-9 rounded-lg border text-xs shadow-sm transition-all focus:outline-none ${
                                                            isSelected ? currentStyle.active : currentStyle.border
                                                        } ${isChecklistLocked ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                                                    >
                                                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                                                        <span>{STATUS_LABELS[status]}</span>
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Bottom Actions Layout */}
            <div className="flex justify-center pt-2">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !selectedSessionId || rows.length === 0 || isChecklistLocked}
                    className="inline-flex items-center justify-center gap-2 min-w-[160px] h-11 rounded-xl bg-zinc-900 border border-transparent px-6 text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900 disabled:cursor-not-allowed select-none active:scale-[0.99]"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving Changes...</span>
                        </>
                    ) : (
                        <span>Save Attendance</span>
                    )}
                </button>
            </div>
        </div>
    );
}