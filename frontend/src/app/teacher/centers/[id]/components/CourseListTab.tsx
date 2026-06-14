"use client";

import Link from "next/link";
import { Plus, Trash2, Mail, BookOpen, Settings, Info, Search, ArchiveRestore, User as UserIcon, GraduationCap, Layers } from "lucide-react";
import { Course, getArchivedCoursesByCenter, restoreCourse } from "@/services/courseService";
import InviteTeacherModal from "./InviteTeacherModal";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import DeleteCourseOtpModal from "./DeleteCourseOtpModal";
import { CourseStatus, getCourseStatusClasses, getCourseStatusLabel, isCourseEnded } from "@/utils/courseStatus";

interface Props {
    courses: Course[];
    centerId: number;
    isManager: boolean;
    onUpdate: () => void;
}

export default function CourseListTab({ courses, centerId, isManager, onUpdate }: Props) {
    const [inviteCourseId, setInviteCourseId] = useState<number | null>(null);
    const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null);
    const [searchText, setSearchText] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("ALL");
    const [selectedGrade, setSelectedGrade] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState<CourseStatus>("IN_PROGRESS");
    const [showArchived, setShowArchived] = useState(false);
    const [archivedCourses, setArchivedCourses] = useState<Course[]>([]);

    useEffect(() => {
        if (!isManager) return;
        getArchivedCoursesByCenter(centerId)
            .then(setArchivedCourses)
            .catch((error) => console.error("Unable to load archived courses", error));
    }, [centerId, isManager, courses]);

    const handleRestore = async (courseId: number) => {
        try {
            await restoreCourse(courseId);
            toast.success("Course successfully restored to active status.");
            setArchivedCourses((current) => current.filter((course) => course.id !== courseId));
            onUpdate();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Unable to restore course.");
        }
    };

    const statusOptions: CourseStatus[] = ["UPCOMING", "IN_PROGRESS", "ENDED"];

    const subjectOptions = useMemo(() => {
        const unique = new Map<string, string>();
        courses.forEach((course) => {
            if (course.subject?.id != null) {
                unique.set(String(course.subject.id), course.subject.name);
            }
        });
        return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
    }, [courses]);

    const gradeOptions = useMemo(() => {
        const unique = new Map<string, string>();
        courses.forEach((course) => {
            if (course.grade?.id != null) {
                unique.set(String(course.grade.id), course.grade.name);
            }
        });
        return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
    }, [courses]);

    const filteredCourses = useMemo(() => {
        const q = searchText.trim().toLowerCase();

        return courses.filter((course) => {
            const matchesStatus = course.status === statusFilter;
            const teacherFullName = `${course.teacher?.lastName || ""} ${course.teacher?.firstName || ""}`.trim().toLowerCase();
            const courseName = (course.name || "").toLowerCase();
            const matchesSearch =
                q.length === 0 ||
                courseName.includes(q) ||
                teacherFullName.includes(q);

            const matchesSubject =
                selectedSubject === "ALL" ||
                String(course.subject?.id || "") === selectedSubject;

            const matchesGrade =
                selectedGrade === "ALL" ||
                String(course.grade?.id || "") === selectedGrade;

            return matchesStatus && matchesSearch && matchesSubject && matchesGrade;
        });
    }, [courses, searchText, selectedSubject, selectedGrade, statusFilter]);

    const deletingCourse = courses.find((course) => course.id === deletingCourseId);

return (
        <div className="space-y-6 animate-fade-in">
            <DeleteCourseOtpModal
                isOpen={deletingCourseId !== null}
                courseId={deletingCourseId}
                courseName={deletingCourse?.name}
                onClose={() => setDeletingCourseId(null)}
                onDeleted={onUpdate}
            />

            {/* TAB TOOLBAR HEADER - UNIFIED GRAPHIC STYLE */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-gray-50 to-transparent p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/20 rounded-lg text-[var(--color-main)]">
                        <BookOpen size={20} className="stroke-[2.2]" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-[var(--color-text)] text-base tracking-tight">
                            {isManager ? "Managed Courses" : "Assigned Courses"}
                        </h3>
                    </div>
                </div>

                {isManager && (
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                            onClick={() => setShowArchived((value) => !value)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all outline-none ${showArchived
                                ? "bg-[var(--color-text)] text-white border-[var(--color-text)] shadow-sm"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 shadow-xs"
                                }`}
                        >
                            <ArchiveRestore size={16} className="stroke-[2.2]" />
                            <span>Archived ({archivedCourses.length})</span>
                        </button>
                        <Link
                            href={`/teacher/courses/create?centerId=${centerId}`}
                            className="flex items-center gap-2 bg-[var(--color-main)] border border-transparent text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-95 shadow-xs transition-all outline-none"
                        >
                            <Plus size={16} className="stroke-[2.5]" />
                            <span>Create Course</span>
                        </Link>
                    </div>
                )}
            </div>

            {/* ARCHIVED DRAWER ACCORDION */}
            {showArchived && isManager && (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-4 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Archive Ledger</h4>
                        <span className="text-[11px] text-gray-400 font-medium">Read-Only Financial Lock</span>
                    </div>
                    {archivedCourses.length === 0 ? (
                        <p className="text-sm text-gray-400 italic py-2">No archived repositories available.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {archivedCourses.map((course) => (
                                <div key={course.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs">
                                    <div className="space-y-0.5">
                                        <Link href={`/teacher/courses/${course.id}`} className="font-bold text-sm text-[var(--color-text)] hover:text-[var(--color-main)] hover:underline">
                                            {course.name}
                                        </Link>
                                        <p className="text-xs text-gray-400">Historical configuration preserved.</p>
                                    </div>
                                    <button
                                        onClick={() => handleRestore(course.id)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-[var(--color-main)] hover:bg-[var(--color-secondary)]/10 hover:border-[var(--color-secondary)]/30 transition-all outline-none"
                                    >
                                        <ArchiveRestore size={14} /> Restore
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* FILTERS PANEL MATCHING USER CONTROL BAR */}
            <div className="space-y-3 bg-gray-50 p-1.5 rounded-xl border border-gray-200/60 shadow-xs">
                {/* Search and Select Row */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="relative md:col-span-2">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Search class label or instructor signature..."
                            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-[var(--color-text)] placeholder-gray-400 outline-none transition-all focus:border-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-main)]/10"
                        />
                    </div>

                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm font-medium text-gray-600 outline-none transition-all focus:border-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-main)]/10 cursor-pointer"
                    >
                        <option value="ALL">All Subjects</option>
                        {subjectOptions.map((subject) => (
                            <option key={subject.id} value={subject.id}>{subject.name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm font-medium text-gray-600 outline-none transition-all focus:border-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-main)]/10 cursor-pointer"
                    >
                        <option value="ALL">All Grades</option>
                        {gradeOptions.map((grade) => (
                            <option key={grade.id} value={grade.id}>{grade.name}</option>
                        ))}
                    </select>
                </div>

                {/* Status Segment Control Buttons */}
                <div className="flex flex-wrap gap-1.5 border-t border-gray-200/50 pt-2">
                    {statusOptions.map((status) => {
                        const isActive = statusFilter === status;
                        return (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setStatusFilter(status)}
                                className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border outline-none ${isActive
                                    ? "border-[var(--color-main)] bg-[var(--color-main)] text-white shadow-xs"
                                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-[var(--color-text)]"
                                    }`}
                            >
                                {getCourseStatusLabel(status)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* COURSES INTERACTIVE DATA GRID */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredCourses.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-xl border border-gray-200/80 shadow-xs flex flex-col items-center justify-center space-y-2">
                        <GraduationCap className="w-10 h-10 text-gray-300 stroke-[1.5]" />
                        <p className="text-sm font-semibold text-gray-600">
                            {courses.length === 0
                                ? (isManager
                                    ? "No active system courses initialized yet."
                                    : "No instruction streams assigned to your credentials.")
                                : `No dynamic ${getCourseStatusLabel(statusFilter).toLowerCase()} courses matching conditions.`}
                        </p>
                        <p className="text-xs text-gray-400">Modify your filter array or instantiate a replacement layout.</p>
                    </div>
                ) : (
                    filteredCourses.map(course => (
                        <div
                            key={course.id}
                            className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                        >
                            {/* TOP HEADER SECTION CARD - HARMONIZED WITH HIGHLIGHTED TEXT PREFERENCES */}
                            <div className="flex justify-between items-center bg-[var(--color-main)] px-4 py-3 border-b border-[var(--color-text)]/10 shadow-xs">
                                {/* High Contrast Status Badge */}
                                <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-black tracking-wider uppercase border shadow-sm ${getCourseStatusClasses(course.status)}`}>
                                    {getCourseStatusLabel(course.status)}
                                </span>

                                <div className="flex items-center gap-1.5">
                                    {/* VIEW INFO BUTTON */}
                                    <Link
                                        href={`/teacher/courses/${course.id}`}
                                        title="View Metrics Dashboard"
                                        className="p-1.5 rounded-lg border border-white/10 bg-white/10 text-white hover:bg-white/20 hover:text-white transition-all outline-none"
                                    >
                                        <Info size={14} className="stroke-[2.5]" />
                                    </Link>

                                    {isManager && (
                                        <>
                                            {/* SETTINGS BUTTON */}
                                            <Link
                                                href={`/teacher/courses/${course.id}/edit`}
                                                title="Modify Core Configuration"
                                                className="p-1.5 rounded-lg border border-white/10 bg-white/10 text-white hover:bg-white/20 hover:text-white transition-all outline-none"
                                            >
                                                <Settings size={14} className="stroke-[2.5]" />
                                            </Link>

                                            {/* DESTRUCTIVE ARCHIVE BUTTON */}
                                            {isCourseEnded(course.status) && (
                                                <button
                                                    onClick={() => setDeletingCourseId(course.id)}
                                                    title="Archive course ledger"
                                                    className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/20 text-red-200 hover:bg-red-500/40 hover:text-white transition-all outline-none"
                                                >
                                                    <Trash2 size={14} className="stroke-[2.5]" />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* BODY CONTENT CARD BLOCK */}
                            <div className="flex flex-1 flex-col p-5 space-y-4">
                                <div className="space-y-1">
                                    <h4 className="text-base font-extrabold text-[var(--color-text)] group-hover:text-[var(--color-main)] transition-colors line-clamp-2 min-h-[3rem] tracking-tight">
                                        {course.name}
                                    </h4>
                                </div>

                                {/* META LIST INFRASTRUCTURE */}
                                <div className="space-y-2.5 text-xs text-gray-500 flex-1">
                                    {/* SUBJECT ATTRIBUTE */}
                                    <div className="flex items-center gap-2.5 bg-gray-50/70 border border-gray-100 rounded-xl px-3 py-2.5">
                                        <Layers size={14} className="text-gray-400 stroke-[2.2]" />
                                        <div className="truncate font-medium">
                                            <span className="text-gray-400">Subject:</span>{" "}
                                            <span className="font-bold text-gray-600">{course.subject?.name || "Unassigned"}</span>
                                        </div>
                                    </div>

                                    {/* TEACHER MANAGEMENT ROW */}
                                    {isManager && (
                                        <div className="bg-gray-50/70 border border-gray-100 rounded-xl px-3 py-2.5 space-y-2">
                                            <div className="flex items-center gap-2.5">
                                                <UserIcon size={14} className="text-gray-400 stroke-[2.2]" />
                                                <div className="truncate font-medium">
                                                    <span className="text-gray-400">Instructor:</span>{" "}
                                                    {course.teacher ? (
                                                        <span className="font-bold text-gray-600">
                                                            {course.teacher.lastName} {course.teacher.firstName}
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-600 font-semibold italic">Vacant Seat</span>
                                                    )}
                                                </div>
                                            </div>

                                            {course.invitationStatus === "PENDING" && (
                                                <div className="text-[10px] uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 rounded px-2 py-0.5 font-bold inline-block animate-pulse">
                                                    Pending teacher validation
                                                </div>
                                            )}

                                            <div className="pt-2 border-t border-gray-200/60">
                                                <button
                                                    onClick={() => setInviteCourseId(course.id)}
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-main)] hover:opacity-80 transition-opacity outline-none"
                                                >
                                                    <Mail size={12} className="stroke-[2.5]" />
                                                    Change Instructor
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* BADGE FOOTER CLASSIFICATION */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    {course.grade ? (
                                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold text-[var(--color-main)] border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 tracking-wide">
                                            {course.grade.name}
                                            {course.grade.fromAge != null && course.grade.toAge != null && (
                                                <span className="ml-1 opacity-70 font-medium">
                                                    ({course.grade.fromAge}–{course.grade.toAge} yrs)
                                                </span>
                                            )}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">No constraints</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* INSTRUCTOR INVITE COMPONENT WORKSPACE */}
            {isManager && (
                <InviteTeacherModal
                    courseId={inviteCourseId}
                    centerId={centerId}
                    isOpen={inviteCourseId !== null}
                    onClose={() => setInviteCourseId(null)}
                    onSuccess={onUpdate}
                />
            )}
        </div>
    );
}