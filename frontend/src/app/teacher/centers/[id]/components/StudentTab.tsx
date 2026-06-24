"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Mail, Phone, Unlink, UserPlus, Users, Search, Filter, Plus } from "lucide-react";
import { User } from "@/services/authService";
import { removeStudentFromCenter } from "@/services/userService";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import AssignStudentModal from "./AssignStudentModal";
import StudentModal from "./StudentModal";
import { useLockBodyScroll } from "@/hook/useLockBodyScroll";

type StudentCenterCard = User & {
    courses: { id: number; name: string }[];
};

interface Props {
    centerId: number;
    students: StudentCenterCard[];
    isManager: boolean;
    onUpdate: () => void;
}

export default function StudentTab({ centerId, students, isManager, onUpdate }: Props) {
    const rowsPerPage = 8; // Adjust cards per page here
    const [searchName, setSearchName] = useState("");
    const [selectedCourseId, setSelectedCourseId] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [isAssignModalOpen, setAssignModalOpen] = useState(false);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [removingStudent, setRemovingStudent] = useState<StudentCenterCard | null>(null);

    const courseOptions = useMemo(() => {
        const map = new Map<number, string>();
        students.forEach((student) => {
            student.courses.forEach((course) => {
                map.set(course.id, course.name);
            });
        });

        return Array.from(map.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [students]);

    const filteredStudents = useMemo(() => {
        const q = searchName.trim().toLowerCase();

        return students.filter((student) => {
            const firstName = (student.firstName || "").trim().toLowerCase();
            const lastName = (student.lastName || "").trim().toLowerCase();
            const fullName = `${lastName} ${firstName}`.trim();
            const reverseFullName = `${firstName} ${lastName}`.trim();
            const matchName =
                q.length === 0 ||
                fullName.includes(q) ||
                reverseFullName.includes(q) ||
                firstName.includes(q) ||
                lastName.includes(q);
            const matchCourse =
                selectedCourseId === "ALL" ||
                student.courses.some((course) => String(course.id) === selectedCourseId);

            return matchName && matchCourse;
        });
    }, [students, searchName, selectedCourseId]);

    // Reset back to page 1 whenever search filters or conditions change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchName, selectedCourseId, students]);

    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage));

    // Handle array boundary edge cases safely
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // Slice filtered array matrix into segmented pages
    const paginatedStudents = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filteredStudents.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredStudents, currentPage]);

    const handleRemoveStudent = async (studentId: number) => {
        try {
            await removeStudentFromCenter(centerId, studentId);
            toast.success("Student removed from center.");
            setRemovingStudent(null);
            onUpdate();
        } catch {
            toast.error("Error removing student.");
        }
    };

    useLockBodyScroll(isAssignModalOpen || isCreateModalOpen || !!removingStudent);

    return (
        <div className="space-y-6">
            <ConfirmModal
                isOpen={!!removingStudent}
                title="Remove Student"
                message={`Remove "${removingStudent?.lastName || ""} ${removingStudent?.firstName || ""}" from this center?`}
                confirmText="Remove"
                onClose={() => setRemovingStudent(null)}
                onConfirm={() => (removingStudent ? handleRemoveStudent(removingStudent.id) : undefined)}
            />

            <StudentModal
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={onUpdate}
                centerId={centerId}
            />

            <AssignStudentModal
                isOpen={isAssignModalOpen}
                onClose={() => setAssignModalOpen(false)}
                centerId={centerId}
                onSuccess={onUpdate}
            />

            {/* MODERNIZED HEADER STYLE BLOCK MATCHED TO GRADELIST/SUBJECTLIST */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-gray-50 to-transparent p-4 rounded-xl border border-gray-100">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-[var(--color-secondary)]/10 text-[var(--color-main)]">
                            <Users size={20} className="stroke-[2.2]" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-lg text-[var(--color-text)] tracking-tight">
                                Student Directory
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                                Showing {filteredStudents.length} of {students.length} enrolled student records
                            </p>
                        </div>
                    </div>
                </div>

                {isManager && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0 self-start sm:self-auto">
                        <button
                            onClick={() => setAssignModalOpen(true)}
                            className="flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm font-semibold text-[var(--color-main)] transition-all outline-none shadow-xs"
                        >
                            <UserPlus size={16} className="stroke-[2.2]" />
                            Assign Student
                        </button>

                        <button
                            onClick={() => setCreateModalOpen(true)}
                            className="flex items-center justify-center gap-2 border border-transparent bg-[var(--color-main)] hover:opacity-95 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all outline-none shadow-xs"
                        >
                            <Plus size={16} className="stroke-[2.5]" />
                            Create Student
                        </button>
                    </div>
                )}
            </div>

            {/* SEARCH & FILTERS CONTROLS UNIFIED */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 bg-gray-50 p-1.5 rounded-xl border border-gray-200/60">
                <div className="relative md:col-span-2">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        placeholder="Search records by student name..."
                        className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-[var(--color-text)] outline-none transition placeholder-gray-400 focus:border-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-main)]/10"
                    />
                </div>

                <div className="relative">
                    <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-main)]/10 appearance-none font-medium text-gray-600"
                    >
                        <option value="ALL">All Enrolled Courses</option>
                        {courseOptions.map((course) => (
                            <option key={course.id} value={course.id}>{course.name}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-500 w-0 h-0" />
                </div>
            </div>

            {/* GRID DIRECTORY LISTINGS */}
            {filteredStudents.length === 0 ? (
                <div className="p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <Users size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-medium">
                        {students.length === 0 ? "No students currently allocated to this center." : "No records match active search parameters."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {paginatedStudents.map((student) => (
                            <div
                                key={student.id}
                                className="flex min-h-[180px] flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                            >
                                <div className="space-y-3.5">
                                    {/* CARD HEADER MATRIX UNIFIED WITH SUBJECT TAB */}
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="inline-flex rounded-lg border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-2.5 py-1 text-xs font-bold text-[var(--color-main)] tracking-wide truncate max-w-[75%]">
                                            {student.lastName} {student.firstName}
                                        </div>

                                        {isManager && (
                                            <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setRemovingStudent(student)}
                                                    className="p-1.5 border border-gray-200 bg-white text-gray-400 rounded-md hover:text-[var(--color-alert)] hover:bg-red-50 hover:border-red-200 transition-all outline-none"
                                                    title="Unlink student profile from center"
                                                >
                                                    <Unlink size={20} className="stroke-[2.5]" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* CONTACT FIELDS CONTAINER INSIDE CONTAINER CARD */}
                                    <div className="rounded-lg bg-gray-50/70 border border-gray-100 p-3 space-y-2 text-xs font-semibold text-gray-600">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <Mail size={13} className="text-[var(--color-main)] shrink-0" />
                                            <span className="truncate select-all text-gray-500 font-medium" title={student.email}>
                                                {student.email}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2.5">
                                            <Phone size={13} className="text-[var(--color-main)] shrink-0" />
                                            <span className={student.phoneNumber ? "text-gray-500 font-medium" : "text-gray-400 italic font-normal"}>
                                                {student.phoneNumber || "No system contact"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* COURSE SUBSECTION LAYER */}
                                <div className="mt-4 pt-3 border-t border-gray-100">
                                    <p className="text-[10px] font-bold tracking-wider uppercase text-gray-400 mb-2 flex items-center gap-1.5">
                                        <BookOpen size={12} className="text-gray-400" />
                                        Active Courses
                                    </p>

                                    {student.courses.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5 max-h-[58px] overflow-y-auto custom-scrollbar">
                                            {student.courses.map((course) => (
                                                <Link
                                                    key={course.id}
                                                    href={`/teacher/courses/${course.id}`}
                                                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 text-[var(--color-main)] hover:bg-[var(--color-main)] hover:text-white transition-all"
                                                >
                                                    {course.name}
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs italic text-gray-400 py-0.5">No enrolled courses</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* PAGINATION PANEL FOOTER */}
                    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between text-xs">
                        <p className="font-medium text-gray-500">
                            Showing <span className="font-bold text-[var(--color-text)]">{(currentPage - 1) * rowsPerPage + 1}</span> -{" "}
                            <span className="font-bold text-[var(--color-text)]">{Math.min(currentPage * rowsPerPage, filteredStudents.length)}</span> of{" "}
                            <span className="font-bold text-[var(--color-text)]">{filteredStudents.length}</span> entries
                        </p>

                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                disabled={currentPage === 1}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white select-none outline-none"
                            >
                                Previous
                            </button>

                            <span className="font-bold text-gray-600 min-w-[70px] text-center">
                                Page {currentPage} / {totalPages}
                            </span>

                            <button
                                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white select-none outline-none"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}