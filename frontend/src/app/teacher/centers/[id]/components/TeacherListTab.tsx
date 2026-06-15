import { useEffect, useMemo, useState } from "react";
import { ShieldAlert, UserCog, UserPlus, Unlink, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { User } from "@/services/authService";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import { unlinkTeacherFromCenter } from "@/services/centerService";
import InviteTeacherModal from "./InviteTeacherModal";

interface Props {
    centerId: number;
    teachers: User[];
    isManager: boolean;
    onUpdate: () => void;
}

export default function TeacherListTab({ centerId, teachers, isManager, onUpdate }: Props) {
    const teachersPerPage = 10;
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [unlinkTeacherId, setUnlinkTeacherId] = useState<number | null>(null);
    const [searchText, setSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const managerId = useMemo(() => {
        const rawUser = localStorage.getItem("user");
        if (!rawUser) return null;
        try {
            const parsed = JSON.parse(rawUser);
            return Number(parsed?.id) || null;
        } catch {
            return null;
        }
    }, []);

    const filteredTeachers = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        if (!q) return teachers;

        return teachers.filter((t) => {
            const fullName = `${t.firstName} ${t.lastName}`.toLowerCase();
            const email = (t.email || "").toLowerCase();
            return fullName.includes(q) || email.includes(q);
        });
    }, [teachers, searchText]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchText, teachers.length]);

    const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / teachersPerPage));

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedTeachers = useMemo(() => {
        const startIndex = (currentPage - 1) * teachersPerPage;
        return filteredTeachers.slice(startIndex, startIndex + teachersPerPage);
    }, [currentPage, filteredTeachers]);

    const selectedTeacher = teachers.find((t) => t.id === unlinkTeacherId);

    const handleConfirmUnlink = async () => {
        if (!unlinkTeacherId) return;
        if (!managerId) {
            toast.error("Manager session not found");
            return;
        }

        try {
            await unlinkTeacherFromCenter(centerId, unlinkTeacherId, managerId);
            toast.success("Teacher unlinked. Their center courses were reassigned to manager.");
            setUnlinkTeacherId(null);
            onUpdate();
        } catch {
            toast.error("Failed to unlink teacher");
        }
    };

    if (!isManager) {
        return (
            <div className="flex flex-col items-center justify-center p-10 text-red-500 border border-red-100 bg-red-50 rounded-xl">
                <ShieldAlert size={48} className="mb-4" />
                <h3 className="font-bold">No access</h3>
                <p>Only center managers can view this section.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <ConfirmModal
                isOpen={unlinkTeacherId !== null}
                title="Unlink Teacher"
                message={`Unlink ${selectedTeacher?.firstName || "this"} ${selectedTeacher?.lastName || "teacher"} from this center? All their courses in this center will be reassigned to the center manager.`}
                confirmText="Unlink"
                onClose={() => setUnlinkTeacherId(null)}
                onConfirm={handleConfirmUnlink}
            />

            <InviteTeacherModal
                courseId={null}
                centerId={centerId}
                isOpen={inviteModalOpen}
                onClose={() => setInviteModalOpen(false)}
                onSuccess={onUpdate}
            />

            {/* UPGRADED HEADER STYLE BLOCK */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-gray-50 to-transparent p-4 rounded-xl border border-gray-100">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-[var(--color-secondary)]/10 text-[var(--color-main)] shrink-0">
                            <UserCog size={20} className="stroke-[2.2]" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-lg text-[var(--color-text)] tracking-tight">
                                Teachers Hub
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                                Manage instructor profiles, course assignment rights, and roster links ({teachers.length} tracked)
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setInviteModalOpen(true)}
                    className="flex items-center gap-2 bg-[var(--color-main)] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--color-main)]/90 border border-transparent shadow-sm active:scale-[0.98] transition-all self-start sm:self-auto"
                >
                    <UserPlus size={18} />
                    Invite Teacher
                </button>
            </div>

            {/* FILTER MODIFIER BAR CONTAINER */}
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200/60 bg-gray-50/60 p-2">
                <div className="relative w-full">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Search teacher by name or email..."
                        className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-[var(--color-text)] outline-none transition placeholder-gray-400 focus:border-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-main)]/10"
                    />
                </div>
            </div>

            {/* REFINED TABLE DATA MATRIX */}
            <div className="bg-white border border-gray-200/70 rounded-xl shadow-sm overflow-hidden">
                {filteredTeachers.length === 0 ? (
                    <div className="p-10 text-center text-xs font-bold text-gray-400">
                        {teachers.length === 0 ? "No records found" : "Zero matching metrics match selection"}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left table-auto">
                            <thead className="bg-[var(--color-main)] border-b border-gray-200 text-white uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-3.5 font-semibold">Name</th>
                                    <th className="px-6 py-3.5 font-semibold">Email</th>
                                    <th className="px-6 py-3.5 font-semibold">Phone</th>
                                    <th className="px-6 py-3.5 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                                {paginatedTeachers.map((t) => (
                                    <tr
                                        key={t.id}
                                        className="hover:bg-gray-50/70 transition-colors duration-150"
                                    >
                                        <td className="px-6 py-4 font-bold text-[var(--color-text)]">
                                            {t.firstName} {t.lastName}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-gray-600">
                                            {t.email}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-gray-500">
                                            {t.phoneNumber || "---"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {managerId === t.id ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-gray-100 text-gray-400 border border-gray-200/50 cursor-not-allowed select-none">
                                                    <Unlink size={13} />
                                                    Owner
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => setUnlinkTeacherId(t.id)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border border-red-100 text-red-500 bg-red-50/30 hover:bg-red-50 hover:text-red-600 transition active:scale-[0.98]"
                                                >
                                                    <Unlink size={13} />
                                                    Unlink
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* CONTROLLERS FOOTER PAGE LAYOUT */}
            {filteredTeachers.length > 0 && (
                <div className="flex flex-col gap-3 rounded-xl border border-gray-200/60 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
                    <p className="text-[11px] font-semibold text-gray-400">
                        Showing entries {(currentPage - 1) * teachersPerPage + 1} to{" "}
                        {Math.min(currentPage * teachersPerPage, filteredTeachers.length)} of {filteredTeachers.length} rows
                    </p>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            disabled={currentPage === 1}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={14} />
                            Prev
                        </button>

                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                            {currentPage} / {totalPages}
                        </span>

                        <button
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                            disabled={currentPage === totalPages}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed"
                        >
                            Next
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}