"use client";

import { useEffect, useState } from "react";
import api from "@/utils/axiosConfig";
import ConfirmModal from "@/components/ConfirmModal";
import { archiveCenter, Center, createCenter, getArchivedCenters, getCenterInvitations, getMyCenters, restoreCenter, updateCenter } from "@/services/centerService";
import { Building2, Plus, Briefcase, Bell, SaveIcon, Edit2Icon, Archive, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Course, getInvitations, respondInvitation } from "@/services/courseService";

const CENTERS_PER_PAGE = 6;

export default function CenterManagementPage() {
    const [managedCenters, setManagedCenters] = useState<Center[]>([]);
    const [teachingCenters, setTeachingCenters] = useState<Center[]>([]);
    const [archivedCenters, setArchivedCenters] = useState<Center[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"managed" | "teaching" | "archived">("managed");
    const [invitations, setInvitations] = useState<Course[]>([]);
    const [centerInvitations, setCenterInvitations] = useState<Center[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: "", description: "", phoneNumber: "" });
    const [editingCenter, setEditingCenter] = useState<Center | null>(null);
    const [archiveTarget, setArchiveTarget] = useState<Center | null>(null);
    const [restoreTarget, setRestoreTarget] = useState<Center | null>(null);
    const [expandedCard, setExpandedCard] = useState<number | null>(null);

    const formatArchivedAt = (archivedAt?: string | null) => {
        if (!archivedAt) {
            return "";
        }

        return new Intl.DateTimeFormat("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(archivedAt));
    };

    const fetchData = async () => {
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr) return;
            const user = JSON.parse(userStr);

            const [resManaged, resTeaching, resArchived] = await Promise.all([
                getMyCenters(user.id),
                api.get(`/centers/teaching/${user.id}`),
                getArchivedCenters(user.id),
            ]);

            setManagedCenters(resManaged);
            setTeachingCenters(resTeaching.data);
            setArchivedCenters(resArchived);

            const pendingInvites = await getInvitations(user.id);
            setInvitations(pendingInvites);

            const pendingCenterInvites = await getCenterInvitations(user.id);
            setCenterInvitations(pendingCenterInvites);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (courseId: number, status: "ACCEPTED" | "REJECTED") => {
        try {
            await respondInvitation(courseId, status);
            toast.success(status === "ACCEPTED" ? "Accepted!" : "Rejected!");
            fetchData();
        } catch {
            toast.error("Error responding to invitation");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, managedCenters.length, teachingCenters.length, archivedCenters.length]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr) return;
            const user = JSON.parse(userStr);

            if (editingCenter) {
                await updateCenter(editingCenter.id, { ...formData, managerId: user.id });
                toast.success("Center updated successfully!");
            } else {
                await createCenter({ ...formData, managerId: user.id });
                toast.success("Center created successfully!");
            }

            setShowForm(false);
            setEditingCenter(null);
            setFormData({ name: "", description: "", phoneNumber: "" });
            fetchData();
        } catch (error: any) {
            const responseData = error?.response?.data;
            const message =
                responseData?.error ||
                responseData?.message ||
                (typeof responseData === "string" ? responseData : null) ||
                `Failed to ${editingCenter ? "update" : "create"} center. Please try again.`;
            toast.error(message);
        }
    };

    const openCreateForm = () => {
        setEditingCenter(null);
        setFormData({ name: "", description: "", phoneNumber: "" });
        setShowForm((current) => !current);
    };

    const openEditForm = (center: Center) => {
        setEditingCenter(center);
        setFormData({
            name: center.name || "",
            description: center.description || "",
            phoneNumber: center.phoneNumber || "",
        });
        setShowForm(true);
    };

    const confirmArchive = async () => {
        if (!archiveTarget) return;

        const userStr = localStorage.getItem("user");
        if (!userStr) return;

        const user = JSON.parse(userStr);

        try {
            await archiveCenter(archiveTarget.id, user.id);
            toast.success("Center archived successfully!");
            setArchiveTarget(null);
            fetchData();
        } catch (error: any) {
            const responseData = error?.response?.data;
            const message =
                responseData?.error ||
                responseData?.message ||
                (typeof responseData === "string" ? responseData : null) ||
                "Failed to archive center.";
            toast.error(message);
        }
    };

    const confirmRestore = async () => {
        if (!restoreTarget) return;

        const userStr = localStorage.getItem("user");
        if (!userStr) return;

        const user = JSON.parse(userStr);

        try {
            await restoreCenter(restoreTarget.id, user.id);
            toast.success("Center restored successfully!");
            setRestoreTarget(null);
            fetchData();
        } catch (error: any) {
            const responseData = error?.response?.data;
            const message =
                responseData?.error ||
                responseData?.message ||
                (typeof responseData === "string" ? responseData : null) ||
                "Failed to restore center.";
            toast.error(message);
        }
    };

    const visibleCenters = activeTab === "managed"
        ? managedCenters
        : activeTab === "teaching"
            ? teachingCenters
            : archivedCenters;

    const totalPages = Math.max(1, Math.ceil(visibleCenters.length / CENTERS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const paginatedCenters = visibleCenters.slice(
        (safeCurrentPage - 1) * CENTERS_PER_PAGE,
        safeCurrentPage * CENTERS_PER_PAGE
    );

    const tabButtonClass = (tab: "managed" | "teaching" | "archived") => {
        const isActive = activeTab === tab;

        return `flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${isActive
                ? "border-[var(--color-main)] bg-[var(--color-main)] text-white shadow-sm"
                : "border-[var(--color-main)]/20 bg-white text-[var(--color-text)] hover:border-[var(--color-main)] hover:text-[var(--color-main)]"
            }`;
    };

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
                    <Building2 className="text-[var(--color-main)]" />
                    Manage Centers
                </h1>

                {activeTab === "managed" && (
                    <button
                        onClick={openCreateForm}
                        className="bg-[var(--color-main)] border-2 border-[var(--color-main)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-soft-white)] hover:text-[var(--color-main)] flex items-center gap-2 transition"
                    >
                        <Plus size={20} /> New Center
                    </button>
                )}
            </div>

            {/* Invitations */}
            {invitations.length > 0 && (
                <div className="bg-[var(--color-alert)]/10 border border-orange-200 rounded-xl p-4 mb-6">
                    <h3 className="text-[var(--color-alert)] font-bold mb-3">
                        <Bell className="inline" size={18} /> You have {invitations.length} new teaching invitations!
                    </h3>

                    <div className="space-y-3">
                        {invitations.map(inv => (
                            <div key={inv.id} className="bg-[var(--color-soft-white)] p-3 rounded-lg border border-[var(--color-alert)] flex justify-between items-center shadow-sm">
                                <div>
                                    <p className="font-bold text-[var(--color-text)]">
                                        {inv.name} (Grade {inv.grade ? inv.grade.name : "-"})
                                    </p>
                                    <p className="text-sm text-[var(--color-text)]">
                                        At: {inv.center?.name}
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleRespond(inv.id, "ACCEPTED")}
                                        className="bg-[var(--color-main)] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[var(--color-positive)] transition"
                                    >
                                        Accept
                                    </button>

                                    <button
                                        onClick={() => handleRespond(inv.id, "REJECTED")}
                                        className="bg-[var(--color-soft-white)] border-2 border-[var(--color-alert)] text-[var(--color-alert)] px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[var(--color-negative)] hover:text-white transition"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {centerInvitations.length > 0 && (
                <div className="bg-[var(--color-main)]/10 border border-[var(--color-main)]/30 rounded-xl p-4 mb-6">
                    <h3 className="text-[var(--color-main)] font-bold mb-3">
                        <Bell className="inline" size={18} /> You were invited to {centerInvitations.length} center(s)
                    </h3>

                    <div className="space-y-2">
                        {centerInvitations.map((center) => (
                            <div
                                key={center.id}
                                className="bg-[var(--color-soft-white)] p-3 rounded-lg border border-[var(--color-main)]/30 flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-bold text-[var(--color-text)]">{center.name}</p>
                                    <p className="text-sm text-[var(--color-text)]">Manager: {center.manager?.lastName} {center.manager?.firstName}</p>
                                </div>

                                <Link
                                    href={`/teacher/centers/${center.id}`}
                                    className="px-3 py-1.5 rounded-lg border-2 border-[var(--color-main)] bg-[var(--color-main)] text-white hover:bg-[var(--color-soft-white)] hover:text-[var(--color-main)] transition"
                                >
                                    View Center
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Form */}
            {showForm && (
                <div className="bg-[var(--color-soft-white)] p-6 rounded-xl border border-blue-100">
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <h3 className="font-bold text-[var(--color-text)]">
                            {editingCenter ? `Edit ${editingCenter.name}` : "Enter new center information"}
                        </h3>

                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setEditingCenter(null);
                                setFormData({ name: "", description: "", phoneNumber: "" });
                            }}
                            className="rounded-lg border border-[var(--color-main)] px-3 py-1.5 text-sm font-medium text-[var(--color-main)] transition hover:bg-[var(--color-main)] hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>

                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="font-medium text-[var(--color-text)]">Center Name <span className="text-[var(--color-negative)]">*</span></label>
                            <input
                                required
                                type="text"
                                className="w-full mt-1 p-2 border border-[var(--color-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-secondary)] outline-none"
                                placeholder="Example: Math Learning Center"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-[var(--color-text)]">Phone Number</label>
                            <input
                                type="text"
                                className="w-full mt-1 p-2 border border-[var(--color-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-secondary)] outline-none"
                                placeholder="0909..."
                                value={formData.phoneNumber}
                                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="text-sm font-medium text-[var(--color-text)]">Description / Address</label>
                            <textarea
                                className="w-full mt-1 p-2 border border-[var(--color-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-secondary)] outline-none"
                                rows={2}
                                placeholder="Short description..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 text-right">
                            <button
                                type="submit"
                                className="bg-[var(--color-main)] border-2 border-[var(--color-main)] text-white px-4 py-2 rounded-lg font-bold hover:bg-[var(--color-soft-white)] hover:text-[var(--color-main)] transition disabled:opacity-50"
                            >
                                <SaveIcon className="inline" /> {editingCenter ? "Update Center" : "Create Center"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tabs */}
            <div className="rounded-2xl border border-[var(--color-main)]/15 bg-[var(--color-soft-white)] p-4 shadow-sm">
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setActiveTab("managed")}
                        className={tabButtonClass("managed")}
                    >
                        <Building2 size={18} /> Managed by Me ({managedCenters.length})
                    </button>

                    <button
                        onClick={() => setActiveTab("teaching")}
                        className={tabButtonClass("teaching")}
                    >
                        <Briefcase size={18} /> Teaching At ({teachingCenters.length})
                    </button>

                    <button
                        onClick={() => setActiveTab("archived")}
                        className={tabButtonClass("archived")}
                    >
                        <Archive size={18} /> Archived ({archivedCenters.length})
                    </button>
                </div>
            </div>

            <ConfirmModal
                isOpen={!!archiveTarget}
                title="Archive Center"
                message={archiveTarget
                    ? `Are you sure you want to archive ${archiveTarget.name}? The archive date and time will be saved, and the center will move to the archived tab.`
                    : ""
                }
                confirmText="Archive"
                cancelText="Cancel"
                onConfirm={confirmArchive}
                onClose={() => setArchiveTarget(null)}
            />

            <ConfirmModal
                isOpen={!!restoreTarget}
                title="Restore Center"
                message={restoreTarget
                    ? `Restore ${restoreTarget.name}? The center will move back to the managed tab and become editable again.`
                    : ""
                }
                confirmText="Restore"
                cancelText="Cancel"
                onConfirm={confirmRestore}
                onClose={() => setRestoreTarget(null)}
            />

            {/* Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
                {loading ? (
                    Array.from({ length: 2 }).map((_, index) => (
                        <div
                            key={index}
                            className="group overflow-hidden rounded-2xl border border-[var(--color-main)]/15 bg-white shadow-sm animate-pulse"
                        >
                            {/* Top gradient area */}
                            <div className="bg-gray-300 px-5 py-4 h-32 relative overflow-hidden">
                                <div className="absolute inset-0 shimmer"></div>

                                <div className="relative z-10">
                                    <div className="h-6 w-24 rounded bg-white/40 mb-4"></div>

                                    <div className="h-8 w-2/3 rounded bg-white/50"></div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-4">
                                {/* Info cards */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-gray-100 p-4">
                                        <div className="h-3 w-16 rounded bg-gray-300 mb-2"></div>
                                        <div className="h-4 w-24 rounded bg-gray-200"></div>
                                    </div>

                                    <div className="rounded-xl bg-gray-100 p-4">
                                        <div className="h-3 w-14 rounded bg-gray-300 mb-2"></div>
                                        <div className="h-4 w-20 rounded bg-gray-200"></div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="rounded-xl bg-gray-100 p-4 space-y-2">
                                    <div className="h-3 w-full rounded bg-gray-300"></div>
                                    <div className="h-3 w-5/6 rounded bg-gray-300"></div>
                                    <div className="h-3 w-2/3 rounded bg-gray-300"></div>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-2 pt-2">
                                    <div className="h-10 w-24 rounded-lg bg-gray-300"></div>
                                    <div className="h-10 w-28 rounded-lg bg-gray-200"></div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : paginatedCenters.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--color-main)]/30 bg-white p-12 text-center text-[var(--color-text)] shadow-sm lg:col-span-2 2xl:col-span-3">
                        {activeTab === "managed"
                            ? "No managed centers available yet."
                            : activeTab === "teaching"
                                ? "No teaching centers available yet."
                                : "No archived centers available yet."}
                    </div>
                ) : (
                    paginatedCenters.map(center => (
                        <div
                            key={center.id}
                            className="group flex min-h-[280px] flex-col overflow-hidden rounded-2xl border border-[var(--color-main)]/20 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            <div className="bg-gradient-to-r from-[var(--color-main)] via-[var(--color-main)] to-[var(--color-secondary)] px-5 py-4 text-white">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-3 flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/90">
                                                {activeTab === "managed"
                                                    ? "Managed"
                                                    : activeTab === "teaching"
                                                        ? "Teaching"
                                                        : "Archived"}
                                            </span>

                                            {center.phoneNumber && (
                                                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                                                    {center.phoneNumber}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-2xl font-semibold leading-snug break-words">
                                            {center.name}
                                        </h3>
                                    </div>

                                    {activeTab !== "archived" && (
                                        <Link
                                            href={`/teacher/centers/${center.id}`}
                                            className="shrink-0 rounded-xl border border-white/25 bg-white/10 p-2 text-white transition hover:bg-white hover:text-[var(--color-main)]"
                                        >
                                            <ExternalLink size={24} />
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col gap-4 p-5">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl bg-[var(--color-soft-white)] px-4 py-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text)]/55">
                                            Manager
                                        </p>
                                        <p className="mt-1 font-semibold text-[var(--color-text)]">
                                            {center.manager?.lastName} {center.manager?.firstName}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-[var(--color-soft-white)] px-4 py-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text)]/55">
                                            Status
                                        </p>
                                        <p className="mt-1 font-semibold text-[var(--color-text)]">
                                            {activeTab === "archived" ? "Archived Center" : "Active Center"}
                                        </p>
                                    </div>
                                </div>

                                <div
                                    className={`rounded-xl border border-[var(--color-main)]/10 bg-[var(--color-soft-white)] px-4 py-3 text-sm text-[var(--color-text)] leading-relaxed break-words ${expandedCard === center.id
                                        ? "max-h-32 overflow-y-auto"
                                        : "line-clamp-3"
                                        }`}
                                >
                                    {center.description || "No description provided."}
                                </div>

                                {center.description && center.description.length > 120 && (
                                    <button
                                        onClick={() =>
                                            setExpandedCard(
                                                expandedCard === center.id ? null : center.id
                                            )
                                        }
                                        className="w-fit text-xs font-semibold text-[var(--color-main)] transition hover:underline"
                                    >
                                        {expandedCard === center.id ? "Show less" : "Show more"}
                                    </button>
                                )}

                                <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--color-main)]/10 pt-4">
                                    {activeTab === "managed" ? (
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditForm(center)}
                                                className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--color-secondary)] bg-[var(--color-secondary)] px-3 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-[var(--color-secondary)]"
                                            >
                                                <Edit2Icon size={18} /> Edit
                                            </button>
                                            <button
                                                onClick={() => setArchiveTarget(center)}
                                                className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--color-alert)] bg-[var(--color-alert)] px-3 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-[var(--color-alert)]"
                                            >
                                                <Archive size={18} /> Archive
                                            </button>
                                        </div>
                                    ) : activeTab === "teaching" ? (
                                        <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                                            Assigned by center manager
                                        </span>
                                    ) : (
                                        <div className="flex w-full items-center justify-between gap-3">
                                            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700">
                                                Archived: {formatArchivedAt(center.archivedAt)}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => setRestoreTarget(center)}
                                                className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--color-main)] px-3 py-2 text-sm font-medium text-[var(--color-main)] transition hover:bg-[var(--color-main)] hover:text-white"
                                            >
                                                <RotateCcw size={16} /> Restore
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {!loading && visibleCenters.length > 0 && (
                <div className="flex items-center justify-between rounded-2xl border border-[var(--color-main)]/15 bg-[var(--color-soft-white)] px-4 py-3 shadow-sm">
                    <p className="text-sm text-[var(--color-text)]">
                        Showing {(safeCurrentPage - 1) * CENTERS_PER_PAGE + 1}-{Math.min(safeCurrentPage * CENTERS_PER_PAGE, visibleCenters.length)} of {visibleCenters.length} centers
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            disabled={safeCurrentPage === 1}
                            className="flex items-center gap-1 rounded-lg border border-[var(--color-main)] px-3 py-2 text-sm font-medium text-[var(--color-main)] transition hover:bg-[var(--color-main)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ChevronLeft size={16} /> Prev
                        </button>

                        <span className="min-w-20 text-center text-sm font-medium text-[var(--color-text)]">
                            Page {safeCurrentPage} / {totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                            disabled={safeCurrentPage === totalPages}
                            className="flex items-center gap-1 rounded-lg border border-[var(--color-main)] px-3 py-2 text-sm font-medium text-[var(--color-main)] transition hover:bg-[var(--color-main)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}