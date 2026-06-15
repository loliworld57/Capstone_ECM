"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Users, Search, Filter, Plus, UserCog, ChevronLeft, ChevronRight } from "lucide-react";
import { getMyCenters, Center } from "@/services/centerService";
import toast from "react-hot-toast";

// Import child components
import StudentTable from "./components/StudentTable";
import {
    deleteOrRolloutStudent,
    getTeacherStudents,
    rollbackStudent,
    resetStudentPassword,
    TeacherManagedStudent,
} from "@/services/userService";
import StudentModal from "./components/StudentModal";
import ConfirmModal from "@/components/ConfirmModal";

export default function GlobalStudentsPage() {
    const studentsPerPage = 10;
    const [studentStatus, setStudentStatus] = useState<"active" | "rolled-out">("active");
    const [studentScope, setStudentScope] = useState<"own" | "other">("own");
    
    // 1. STATE QUẢN LÝ DỮ LIỆU
    const [allStudents, setAllStudents] = useState<TeacherManagedStudent[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<TeacherManagedStudent[]>([]);
    const [centers, setCenters] = useState<Center[]>([]);
    const [loading, setLoading] = useState(true);

    // 2. STATE UI & FILTER
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCenterId, setSelectedCenterId] = useState<string>("ALL");
    const [currentPage, setCurrentPage] = useState(1);

    const [isModalOpen, setModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<TeacherManagedStudent | undefined>(undefined);
    const [deletingStudentId, setDeletingStudentId] = useState<number | null>(null);
    const [resettingStudent, setResettingStudent] = useState<TeacherManagedStudent | null>(null);
    const [rollingBackStudent, setRollingBackStudent] = useState<TeacherManagedStudent | null>(null);

    // 3. FETCH DATA
    const fetchData = async () => {
        try {
            setLoading(true);
            const userStr = localStorage.getItem("user");
            if (!userStr) return;
            const user = JSON.parse(userStr);

            const resCenters = await getMyCenters(user.id);
            setCenters(resCenters);

            const teacherStudents = await getTeacherStudents(user.id, studentStatus);
            setAllStudents(teacherStudents);
            setFilteredStudents(teacherStudents);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [studentStatus]);

    // 4. XỬ LÝ FILTER (Tìm kiếm & Lọc theo Center)
    useEffect(() => {
        let result = allStudents;

        if (studentStatus === "active") {
            result = result.filter((student) =>
                studentScope === "own" ? student.canManage : !student.canManage
            );
        }

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(s =>
                s.firstName.toLowerCase().includes(lower) ||
                s.lastName.toLowerCase().includes(lower) ||
                s.email.toLowerCase().includes(lower) ||
                (s.phoneNumber && s.phoneNumber.includes(lower))
            );
        }

        if (studentStatus === "active" && selectedCenterId !== "ALL") {
            if (selectedCenterId === "NONE") {
                result = result.filter(s => !s.connectedCenters || s.connectedCenters.length === 0);
            } else {
                result = result.filter(s =>
                    s.connectedCenters && s.connectedCenters.some((c) => c.id === Number(selectedCenterId))
                );
            }
        }

        setFilteredStudents(result);
        setCurrentPage(1);
    }, [searchTerm, selectedCenterId, allStudents, studentStatus, studentScope]);

    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / studentsPerPage));

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedStudents = filteredStudents.slice(
        (currentPage - 1) * studentsPerPage,
        currentPage * studentsPerPage
    );

    const handleDeleteStudent = async (studentId: number) => {
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const message = await deleteOrRolloutStudent(user.id, studentId);
            toast.success(message);
            setDeletingStudentId(null);

            setAllStudents(prev => prev.filter(s => s.id !== studentId));
            setFilteredStudents(prev => prev.filter(s => s.id !== studentId));
        } catch (e) {
            if (axios.isAxiosError(e)) {
                toast.error(String(e.response?.data || "Unable to update student."));
            } else {
                toast.error("Unable to update student.");
            }
        }
    };

    const handleResetPassword = async (student: TeacherManagedStudent) => {
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const message = await resetStudentPassword(user.id, student.id);
            toast.success(`${message} Login: ${student.email}`);
            setResettingStudent(null);
        } catch (e) {
            if (axios.isAxiosError(e)) {
                toast.error(String(e.response?.data || "Unable to reset password."));
            } else {
                toast.error("Unable to reset password.");
            }
        }
    };

    const handleRollbackStudent = async (student: TeacherManagedStudent) => {
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const message = await rollbackStudent(user.id, student.id);
            toast.success(message);
            setRollingBackStudent(null);
            setAllStudents(prev => prev.filter(s => s.id !== student.id));
            setFilteredStudents(prev => prev.filter(s => s.id !== student.id));
        } catch (e) {
            if (axios.isAxiosError(e)) {
                toast.error(String(e.response?.data || "Unable to rollback student."));
            } else {
                toast.error("Unable to rollback student.");
            }
        }
    };

    const deletingStudent = allStudents.find((s) => s.id === deletingStudentId);

    const openCreateModal = () => {
        setEditingStudent(undefined);
        setModalOpen(true);
    };

    const openEditModal = (student: any) => {
        setEditingStudent(student);
        setModalOpen(true);
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-1">
            <ConfirmModal
                isOpen={deletingStudentId !== null}
                title="Roll Out Student"
                message={`Roll out "${deletingStudent?.lastName || ""} ${deletingStudent?.firstName || ""}"? This disables the account, removes current center links, clears enrollments, and hides the student from active lists.`}
                confirmText="Roll Out"
                onClose={() => setDeletingStudentId(null)}
                onConfirm={() => (deletingStudentId !== null ? handleDeleteStudent(deletingStudentId) : undefined)}
            />

            <ConfirmModal
                isOpen={!!resettingStudent}
                title="Reset Student Password"
                message={`Reset the password for "${resettingStudent?.lastName || ""} ${resettingStudent?.firstName || ""}" to the default password "ecm123"?`}
                confirmText="Reset Password"
                onClose={() => setResettingStudent(null)}
                onConfirm={() => (resettingStudent ? handleResetPassword(resettingStudent) : undefined)}
            />

            <ConfirmModal
                isOpen={!!rollingBackStudent}
                title="Rollback Student"
                message={`Restore "${rollingBackStudent?.lastName || ""} ${rollingBackStudent?.firstName || ""}" back to the active student list?`}
                confirmText="Rollback"
                onClose={() => setRollingBackStudent(null)}
                onConfirm={() => (rollingBackStudent ? handleRollbackStudent(rollingBackStudent) : undefined)}
            />

            {/* HEADER AREA */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-text)]/15 pb-5">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] flex items-center gap-2.5">
                        <div className="p-2 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl">
                            <Users size={22} className="stroke-[2.5]" />
                        </div>
                        Manage Students
                    </h1>
                    <p className="text-sm text-[var(--color-text)]/70 max-w-2xl">
                        {studentStatus === "active"
                            ? studentScope === "own"
                                ? "Shows students you created or directly manage."
                                : "Shows students who joined your courses but are managed by another teacher."
                            : "Shows rolled out students created by you. Students can only be restored from here."}
                    </p>
                </div>

                {studentStatus === "active" && (
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-[var(--color-main)] text-white hover:opacity-90 transition-all active:scale-[0.98] shadow-sm shadow-[var(--color-main)]/10 shrink-0"
                    >
                        <Plus size={16} className="stroke-[3]" />
                        Add New Student
                    </button>
                )}
            </div>

            {/* SEGMENTED CONTROL TABS */}
            <div className="flex items-center border-b border-[var(--color-text)]/10">
                <div className="flex bg-[var(--color-text)]/5 p-1 rounded-xl gap-1">
                    <button
                        onClick={() => {
                            setStudentStatus("active");
                            setStudentScope("own");
                            setSelectedCenterId("ALL");
                        }}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                            studentStatus === "active"
                                ? "bg-white text-[var(--color-main)] shadow-sm"
                                : "text-[var(--color-text)]/70 hover:text-[var(--color-text)]"
                        }`}
                    >
                        Active List
                    </button>

                    <button
                        onClick={() => {
                            setStudentStatus("rolled-out");
                            setStudentScope("own");
                            setSelectedCenterId("ALL");
                        }}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                            studentStatus === "rolled-out"
                                ? "bg-[var(--color-alert)]/10 text-[var(--color-alert)] shadow-sm"
                                : "text-[var(--color-text)]/70 hover:text-[var(--color-alert)]"
                        }`}
                    >
                        Rolled Out Archive
                    </button>
                </div>
            </div>

            {/* FILTER & SEARCH TOOLBAR CONTAINER */}
            <div className="bg-white border border-[var(--color-text)]/15 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
                {/* SEARCH INPUT */}
                <div className="relative w-full flex-1">
                    <Search
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text)]/40"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder="Search student name, email, phone number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-[var(--color-text)]/15 rounded-xl outline-none focus:border-[var(--color-main)] focus:ring-4 focus:ring-[var(--color-main)]/10 transition-all bg-[var(--color-text)]/[0.02] text-[var(--color-text)]"
                    />
                </div>

                {/* DROPDOWN FILTER CENTER */}
                {studentStatus === "active" && studentScope === "own" && (
                    <div className="relative w-full md:w-72 shrink-0">
                        <Filter
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text)]/40 pointer-events-none"
                            size={16}
                        />
                        <select
                            title="Select Center"
                            value={selectedCenterId}
                            onChange={(e) => setSelectedCenterId(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 text-sm border border-[var(--color-text)]/15 rounded-xl outline-none focus:border-[var(--color-main)] focus:ring-4 focus:ring-[var(--color-main)]/10 transition-all bg-white appearance-none cursor-pointer text-[var(--color-text)] font-medium shadow-sm"
                        >
                            <option value="ALL">All Operational Centers</option>
                            {centers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                            <option value="NONE">Unassigned (No Center Link)</option>
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-[var(--color-text)]/60 pointer-events-none" />
                    </div>
                )}
            </div>

            {/* SUB-SCOPE TABS BLOCK */}
            {studentStatus === "active" && (
                <div className="border-b border-[var(--color-text)]/10 flex items-center gap-2">
                    <button
                        onClick={() => {
                            setStudentScope("own");
                            setSelectedCenterId("ALL");
                        }}
                        className={`px-4 py-2.5 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                            studentScope === "own"
                                ? "border-[var(--color-main)] text-[var(--color-main)]"
                                : "border-transparent text-[var(--color-text)]/60 hover:text-[var(--color-text)]"
                        }`}
                    >
                        <Users size={16} className="stroke-[2.5]" /> My Students
                    </button>

                    <button
                        onClick={() => {
                            setStudentScope("other");
                            setSelectedCenterId("ALL");
                        }}
                        className={`px-4 py-2.5 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                            studentScope === "other"
                                ? "border-[var(--color-main)] text-[var(--color-main)]"
                                : "border-transparent text-[var(--color-text)]/60 hover:text-[var(--color-text)]"
                        }`}
                    >
                        <UserCog size={16} className="stroke-[2.5]" /> Shared Access (Other Teachers)
                    </button>
                </div>
            )}

            {/* STUDENT CONTENT TABLE CONTAINER */}
            <div className="bg-white border border-[var(--color-text)]/15 rounded-xl overflow-hidden shadow-sm">
                <StudentTable
                    students={paginatedStudents}
                    loading={loading}
                    onDelete={studentStatus === "active" && studentScope === "own" ? (studentId) => setDeletingStudentId(studentId) : undefined}
                    onResetPassword={studentStatus === "active" && studentScope === "own" ? (student) => setResettingStudent(student) : undefined}
                    onRollback={studentStatus === "rolled-out" ? (student) => setRollingBackStudent(student) : undefined}
                    onEdit={studentStatus === "active" && studentScope === "own" ? openEditModal : undefined}
                    deleteLabel="Roll Out"
                />
            </div>

            {/* PAGINATION CONTROL FOOTER */}
            {!loading && filteredStudents.length > 0 && (
                <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-text)]/15 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-[var(--color-text)]/60 font-medium">
                        Showing <span className="text-[var(--color-text)] font-semibold">{(currentPage - 1) * studentsPerPage + 1}</span> to{" "}
                        <span className="text-[var(--color-text)] font-semibold">{Math.min(currentPage * studentsPerPage, filteredStudents.length)}</span> of{" "}
                        <span className="text-[var(--color-text)] font-semibold">{filteredStudents.length}</span> entries
                    </p>

                    <div className="flex items-center gap-2 justify-end">
                        <button
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            disabled={currentPage === 1}
                            className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-text)]/15 bg-white px-3 py-1.5 text-sm font-semibold text-[var(--color-text)]/80 transition hover:bg-[var(--color-text)]/[0.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white shadow-sm"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>

                        <span className="text-xs font-bold text-[var(--color-text)]/50 uppercase tracking-wider px-3">
                            Page {currentPage} / {totalPages}
                        </span>

                        <button
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                            disabled={currentPage === totalPages}
                            className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-text)]/15 bg-white px-3 py-1.5 text-sm font-semibold text-[var(--color-text)]/80 transition hover:bg-[var(--color-text)]/[0.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white shadow-sm"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            <StudentModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={fetchData}
                studentToEdit={editingStudent}
            />
        </div>
    );
}