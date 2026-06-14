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
    <div className="space-y-8 animate-fade-in pb-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
            <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Building2 size={24} className="stroke-[2.5]" />
                    </div>
                    Manage Centers
                </h1>
                <p className="text-sm font-medium text-slate-500 mt-1 pl-1">
                    Oversee your operated institutions, faculty nodes, and active classroom modules.
                </p>
            </div>

            {activeTab === "managed" && (
                <button
                    onClick={openCreateForm}
                    className="w-full sm:w-auto self-start bg-indigo-600 border border-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-white hover:text-indigo-600 flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-md shadow-indigo-600/10"
                >
                    <Plus size={18} className="stroke-[3]" /> New Center
                </button>
            )}
        </div>

        {/* Teaching Invitations Panel */}
        {invitations.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-sm shadow-amber-500/5 animate-slide-up">
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-sm animate-pulse">
                        <Bell size={16} className="stroke-[2.5]" />
                    </div>
                    <h3 className="text-amber-800 font-extrabold text-base tracking-wide">
                        You have {invitations.length} new teaching invitations!
                    </h3>
                </div>

                <div className="space-y-3">
                    {invitations.map(inv => (
                        <div key={inv.id} className="bg-white p-4 rounded-xl border border-amber-200/70 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm hover:border-amber-300 transition-all">
                            <div className="space-y-1">
                                <p className="font-bold text-slate-900 text-base">
                                    {inv.name} <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded ml-1.5 uppercase">Grade {inv.grade ? inv.grade.name : "-"}</span>
                                </p>
                                <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                                    <Building2 size={14} className="text-slate-400" />
                                    At: <span className="text-slate-700 font-semibold">{inv.center?.name}</span>
                                </p>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                    onClick={() => handleRespond(inv.id, "ACCEPTED")}
                                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition shadow-sm"
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={() => handleRespond(inv.id, "REJECTED")}
                                    className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Center Invitations Panel */}
        {centerInvitations.length > 0 && (
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5 shadow-sm shadow-indigo-500/5 animate-slide-up">
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-sm">
                        <Bell size={16} className="stroke-[2.5]" />
                    </div>
                    <h3 className="text-indigo-900 font-extrabold text-base tracking-wide">
                        You were invited to {centerInvitations.length} center(s)
                    </h3>
                </div>

                <div className="space-y-3">
                    {centerInvitations.map((center) => (
                        <div key={center.id} className="bg-white p-4 rounded-xl border border-indigo-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm hover:border-indigo-200 transition-all">
                            <div className="space-y-1">
                                <p className="font-bold text-slate-900 text-base">{center.name}</p>
                                <p className="text-sm font-medium text-slate-500">
                                    Manager: <span className="text-slate-700 font-semibold">{center.manager?.lastName} {center.manager?.firstName}</span>
                                </p>
                            </div>

                            <Link
                                href={`/teacher/centers/${center.id}`}
                                className="w-full sm:w-auto text-center px-4 py-2 rounded-lg border border-indigo-600 bg-indigo-600 text-white text-sm font-bold hover:bg-white hover:text-indigo-600 transition shadow-sm"
                            >
                                View Center
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Create / Edit Form Area */}
        {showForm && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl shadow-slate-100/40 animate-slide-up">
                <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="font-extrabold text-slate-900 text-lg">
                        {editingCenter ? `Modify Layout: ${editingCenter.name}` : "Establish New Academic Center"}
                    </h3>

                    <button
                        type="button"
                        onClick={() => {
                            setShowForm(false);
                            setEditingCenter(null);
                            setFormData({ name: "", description: "", phoneNumber: "" });
                        }}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                    >
                        Cancel
                    </button>
                </div>

                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Center Name <span className="text-rose-500">*</span></label>
                        <input
                            required
                            type="text"
                            className="w-full p-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900"
                            placeholder="Example: Math Learning Center"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Phone Connection Number</label>
                        <input
                            type="text"
                            className="w-full p-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900"
                            placeholder="e.g., +1 (555) 000-0000"
                            value={formData.phoneNumber}
                            onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                        />
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Detailed Description / Address Location</label>
                        <textarea
                            className="w-full p-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900"
                            rows={3}
                            placeholder="Provide details regarding hours, curriculum specifics, or structural addresses..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="col-span-1 md:col-span-2 text-right pt-2 border-t border-slate-100">
                        <button
                            type="submit"
                            className="bg-indigo-600 border border-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-white hover:text-indigo-600 transition shadow-md shadow-indigo-600/10 active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            <SaveIcon size={16} className="stroke-[2.5]" /> {editingCenter ? "Update Center Configuration" : "Deploy Academic Center"}
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* Layout Navigation Filter Tabs */}
        <div className="border-b border-slate-200/80 pb-1">
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setActiveTab("managed")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeTab === "managed"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                    }`}
                >
                    <Building2 size={16} /> Managed by Me ({managedCenters.length})
                </button>

                <button
                    onClick={() => setActiveTab("teaching")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeTab === "teaching"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                    }`}
                >
                    <Briefcase size={16} /> Teaching At ({teachingCenters.length})
                </button>

                <button
                    onClick={() => setActiveTab("archived")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeTab === "archived"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                    }`}
                >
                    <Archive size={16} /> Archived Vault ({archivedCenters.length})
                </button>
            </div>
        </div>

        {/* Modal Window Elements */}
        <ConfirmModal
            isOpen={!!archiveTarget}
            title="Archive Center"
            message={archiveTarget ? `Are you sure you want to archive ${archiveTarget.name}? Dynamic processing timelines will snapshot, moving this module out of standard views.` : ""}
            confirmText="Archive"
            cancelText="Cancel"
            onConfirm={confirmArchive}
            onClose={() => setArchiveTarget(null)}
        />

        <ConfirmModal
            isOpen={!!restoreTarget}
            title="Restore Center"
            message={restoreTarget ? `Restore operational logs for ${restoreTarget.name}? This object will drop right back into your active operations grid.` : ""}
            confirmText="Restore"
            cancelText="Cancel"
            onConfirm={confirmRestore}
            onClose={() => setRestoreTarget(null)}
        />

        {/* Central Component Information Cards Display Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                    /* ADJUSTED: Synchronized skeleton wrapper to match data cards precisely */
                    <div key={index} className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm animate-pulse flex flex-col min-h-[300px]">
                        <div className="bg-slate-200 h-24 p-5 flex flex-col justify-end">
                            <div className="h-5 bg-slate-300 w-2/3 rounded-md"></div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="h-12 bg-slate-100 rounded-xl"></div>
                                    <div className="h-12 bg-slate-100 rounded-xl"></div>
                                </div>
                                <div className="h-16 bg-slate-100 rounded-xl"></div>
                            </div>
                            <div className="h-10 bg-slate-200 rounded-xl w-1/3"></div>
                        </div>
                    </div>
                ))
            ) : paginatedCenters.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center text-slate-500 shadow-sm md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center space-y-3 min-h-[300px]">
                    <Building2 size={36} className="text-slate-300" />
                    <p className="font-semibold text-slate-700 text-lg">No instances found</p>
                    <p className="text-sm text-slate-400 max-w-sm">
                        {activeTab === "managed"
                            ? "You haven't registered any learning centers yet. Get started by clicking 'New Center'."
                            : activeTab === "teaching"
                                ? "There are currently no assignments under your profile panel."
                                : "The archival vault layer is empty."}
                    </p>
                </div>
            ) : (
                paginatedCenters.map(center => (
                    /* ADJUSTED: Enforced explicit flex direction layouts and uniform minimum heights */
                    <div
                        key={center.id}
                        className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-indigo-200 min-h-[300px]"
                    >
                        {/* Upper Gradient Banner Plate */}
                        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-5 py-5 text-white relative shrink-0">
                            <div className="flex items-start justify-between gap-3 relative z-10">
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-md bg-white/10 backdrop-blur-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-200 border border-white/5">
                                            {activeTab === "managed" ? "Owner" : activeTab === "teaching" ? "Faculty" : "Archived"}
                                        </span>
                                        {center.phoneNumber && (
                                            <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-200">
                                                {center.phoneNumber}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold leading-snug tracking-tight text-white truncate group-hover:text-indigo-200 transition-colors">
                                        {center.name}
                                    </h3>
                                </div>

                                {activeTab !== "archived" && (
                                    <Link
                                        href={`/teacher/centers/${center.id}`}
                                        className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-indigo-600 hover:text-white hover:border-indigo-500 shadow-lg"
                                    >
                                        <ExternalLink size={18} className="stroke-[2.5]" />
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Mid-Card Metric Layout Content wrapper */}
                        <div className="flex flex-1 flex-col justify-between p-5 bg-white min-h-0">
                            <div className="space-y-4 flex-1">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-2.5">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Manager</p>
                                        <p className="mt-0.5 font-bold text-slate-800 text-sm truncate">
                                            {center.manager?.lastName} {center.manager?.firstName}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-2.5">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operations</p>
                                        <p className={`mt-0.5 font-bold text-sm flex items-center gap-1.5 ${activeTab === 'archived' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'archived' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                            {activeTab === "archived" ? "Archived" : "Active"}
                                        </p>
                                    </div>
                                </div>

                                <div
                                    className={`rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5 text-xs font-medium text-slate-600 leading-relaxed break-words ${
                                        expandedCard === center.id ? "max-h-[72px] overflow-y-auto" : "line-clamp-2"
                                    }`}
                                >
                                    {center.description || "No supplemental details provided for this institution structural entity."}
                                </div>
                            </div>

                            {/* Card Base Action Row Layout */}
                            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 mt-4 shrink-0">
                                {activeTab === "managed" ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <button
                                            type="button"
                                            onClick={() => openEditForm(center)}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                                        >
                                            <Edit2Icon size={14} /> Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setArchiveTarget(center)}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-transparent bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
                                        >
                                            <Archive size={14} /> Archive
                                        </button>
                                    </div>
                                ) : activeTab === "teaching" ? (
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100/80 px-3 py-1 rounded-md block w-full text-center">
                                        External Center Assignment Layer
                                    </span>
                                ) : (
                                    <div className="flex w-full items-center justify-between gap-3">
                                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md max-w-[170px] truncate">
                                            Vaulted: {formatArchivedAt(center.archivedAt)}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => setRestoreTarget(center)}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50"
                                        >
                                            <RotateCcw size={14} /> Restore
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Footer-Level Data Pagination Controller Plates */}
        {!loading && visibleCenters.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                    Showing <span className="text-slate-900 font-bold">{(safeCurrentPage - 1) * CENTERS_PER_PAGE + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(safeCurrentPage * CENTERS_PER_PAGE, visibleCenters.length)}</span> of <span className="text-slate-900 font-bold">{visibleCenters.length}</span> active centers
                </p>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={safeCurrentPage === 1}
                        className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
                    >
                        <ChevronLeft size={16} className="stroke-[2.5]" /> Prev
                    </button>

                    <span className="text-sm font-bold text-slate-800 min-w-[90px] text-center">
                        {safeCurrentPage} / {totalPages}
                    </span>

                    <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        disabled={safeCurrentPage === totalPages}
                        className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
                    >
                        Next <ChevronRight size={16} className="stroke-[2.5]" />
                    </button>
                </div>
            </div>
        )}
    </div>
);
}