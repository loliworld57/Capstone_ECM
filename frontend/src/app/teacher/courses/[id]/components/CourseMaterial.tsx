"use client";

import { useState, useEffect } from "react";
import {
    BookOpen,
    Search,
    Plus,
    FileText,
    Video,
    File,
    Download,
    Trash2,
    Loader2,
    X,
    Eye,
    Sparkles,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import api from '@/utils/axiosConfig';
import MaterialAddForm from "./MaterialAddForm";
import ConfirmModal from "@/components/ConfirmModal";
import AiSummaryModal from "./AiSummaryModal";
import { useLockBodyScroll } from "@/hook/useLockBodyScroll";

interface Props {
    courseId: number;
    readOnly?: boolean;
}

interface Material {
    id: number;
    fileName: string;
    fileUrl: string;
    fileType: string;
    summary?: string;
    uploadedDate: string;
}

const ITEMS_PER_PAGE = 5;

export default function CourseMaterials({ courseId, readOnly = false }: Props) {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [keyword, setKeyword] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);

    const [isAiSummaryModalOpen, setIsAiSummaryModalOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [initialModalState, setInitialModalState] = useState<"INPUT" | "REVIEW">("INPUT");

    const openSummaryModal = (material: Material, startingState: "INPUT" | "REVIEW") => {
        setSelectedMaterial(material);
        setInitialModalState(startingState);
        setIsAiSummaryModalOpen(true);
    };

    const fetchMaterials = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/materials/course/${courseId}`);
            setMaterials(response.data);
        } catch (error) {
            console.error("Error fetching materials:", error);
            toast.error("Không thể tải danh sách tài liệu.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) fetchMaterials();
    }, [courseId]);

    // Reset pagination to page 1 whenever the search keyword changes
    useEffect(() => {
        setCurrentPage(1);
    }, [keyword]);

    const getFileIcon = (type: string) => {
        const lowerType = type?.toLowerCase() || "";
        if (lowerType.includes("pdf")) return <FileText size={18} className="text-rose-500" />;
        if (lowerType.includes("video") || lowerType.includes("mp4")) return <Video size={18} className="text-sky-500" />;
        if (lowerType.includes("image")) return <File size={18} className="text-emerald-500" />;
        if (lowerType.includes("document") || lowerType.includes("msword")) return <FileText size={18} className="text-blue-600" />;
        return <File size={18} className="text-slate-400" />;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    };

    // Filter Logic
    const filteredMaterials = materials.filter((m) =>
        m.fileName.toLowerCase().includes(keyword.toLowerCase())
    );

    // Pagination Calculations
    const totalPages = Math.ceil(filteredMaterials.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedMaterials = filteredMaterials.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useLockBodyScroll(isAddModalOpen || isAiSummaryModalOpen);

    const handleDelete = async (id: number) => {
        setDeletingId(id);
        try {
            await api.delete(`/materials/${id}`);
            toast.success("Material deleted successfully!");
            setMaterials((currentMaterials) => currentMaterials.filter((material) => material.id !== id));

            // Adjust page index if the last item on the final page gets deleted
            if (paginatedMaterials.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            }
        } catch (error) {
            console.error("Error deleting material:", error);
            toast.error("Error deleting material.");
        } finally {
            setDeletingId(null);
            setPendingDeleteId(null);
        }
    };

    const pendingDeleteMaterial = materials.find((material) => material.id === pendingDeleteId);

    return (
        <div className="bg-[var(--color-soft-white)] rounded-xl border border-[var(--color-main)] shadow-md overflow-hidden transition-all duration-300">

            <ConfirmModal
                isOpen={!readOnly && pendingDeleteId !== null}
                title="Delete Material"
                message={`Delete "${pendingDeleteMaterial?.fileName || "this material"}"? This action cannot be undone.`}
                confirmText="Delete"
                onClose={() => setPendingDeleteId(null)}
                onConfirm={() => (pendingDeleteId !== null ? handleDelete(pendingDeleteId) : undefined)}
            />

            {/* --- ADD MATERIAL MODAL --- */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className=" mt-20 bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/70">
                            <h2 className="font-bold text-slate-800 text-lg">Add New Material</h2>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all duration-200"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4">
                            <MaterialAddForm
                                courseId={courseId}
                                onSuccess={() => {
                                    setIsAddModalOpen(false);
                                    fetchMaterials();
                                }}
                                onCancel={() => setIsAddModalOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* --- AI SUMMARY MODAL --- */}
            {isAiSummaryModalOpen && selectedMaterial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/70">
                            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <Sparkles size={18} className="text-amber-500" />
                                <span className="truncate">AI Summary: {selectedMaterial.fileName}</span>
                            </h2>
                            <button
                                onClick={() => setIsAiSummaryModalOpen(false)}
                                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all duration-200"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5">
                            <AiSummaryModal
                                materialId={selectedMaterial.id}
                                existingSummary={selectedMaterial.summary}
                                initialState={initialModalState}
                                onSaveSuccess={() => {
                                    setIsAiSummaryModalOpen(false);
                                    fetchMaterials();
                                }}
                                onCancel={() => setIsAiSummaryModalOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="bg-[var(--color-main)] text-white px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5 font-semibold tracking-wide">
                    <BookOpen size={20} className="opacity-90" />
                    <span>Course Materials</span>
                    <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full font-medium">{materials.length}</span>
                </div>

                {!readOnly && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-1.5 bg-white text-[var(--color-main)] hover:bg-slate-50 active:scale-95 px-4 py-2 rounded-xl transition-all duration-200 text-xs font-bold shadow-sm"
                    >
                        <Plus size={16} strokeWidth={2.5} /> Add Material
                    </button>
                )}
            </div>

            <div className="p-6">
                {/* SEARCH BAR */}
                <div className="mb-5 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search materials by title..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border-2 border-slate-200 rounded-xl focus:border-[var(--color-main)] focus:ring-4 focus:ring-[var(--color-main)]/10 outline-none transition-all duration-200"
                    />
                </div>

                {/* MATERIALS TABLE */}
                <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-inner bg-white">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                                <th className="p-4">Title</th>
                                <th className="p-4 w-40">Date Added</th>
                                <th className="p-4 w-52 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="text-center py-12">
                                        <Loader2 size={28} className="animate-spin text-[var(--color-main)] mx-auto mb-3 opacity-80" />
                                        <p className="text-slate-400 font-medium text-xs tracking-wide">Loading materials...</p>
                                    </td>
                                </tr>
                            ) : filteredMaterials.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="text-center text-slate-400 py-12 text-sm">
                                        {keyword ? "No materials match your search." : "No materials uploaded yet."}
                                    </td>
                                </tr>
                            ) : (
                                paginatedMaterials.map((material) => (
                                    <tr
                                        key={material.id}
                                        className="hover:bg-slate-50/60 transition-colors duration-150 group"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3 max-w-md lg:max-w-xl">
                                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white group-hover:scale-105 transition-all duration-200 flex-shrink-0 shadow-sm">
                                                    {getFileIcon(material.fileType)}
                                                </div>
                                                <a
                                                    href={material.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-slate-700 hover:text-[var(--color-main)] hover:underline transition-colors duration-150 line-clamp-1 break-all"
                                                >
                                                    {material.fileName}
                                                </a>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-400 font-medium text-xs">
                                            {formatDate(material.uploadedDate)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <a
                                                    href={material.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    download
                                                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-all duration-200 hover:border-slate-300 hover:text-slate-700 active:scale-95"
                                                    title="View/Download"
                                                >
                                                    <Download size={16} />
                                                </a>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openSummaryModal(material, "REVIEW")}
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 bg-sky-50/50 hover:bg-sky-50 border border-sky-100 hover:border-sky-200 px-2.5 py-1.5 rounded-xl transition-all duration-200 shadow-sm active:scale-95"
                                                        title="Edit Summary"
                                                    >
                                                        <FileText size={14} />
                                                        <span>
                                                            {material.summary ? "Edit" : "Summarize"}
                                                        </span>
                                                    </button>

                                                    {material.summary && (
                                                        <button
                                                            onClick={() => openSummaryModal(material, "INPUT")}
                                                            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-700 bg-amber-50/50 hover:bg-amber-50 border border-sky-100 hover:border-sky-200 px-2.5 py-1.5 rounded-xl transition-all duration-200 shadow-sm active:scale-95"
                                                            title="Generate with AI"
                                                        >
                                                            <Sparkles size={13} />
                                                            <span>AI</span>
                                                        </button>
                                                    )}
                                                </div>

                                                {!readOnly && (
                                                    <button
                                                        onClick={() => setPendingDeleteId(material.id)}
                                                        disabled={deletingId === material.id}
                                                        className="inline-flex items-center justify-center rounded-xl border border-rose-100 bg-rose-50/30 p-2 text-rose-500 shadow-sm transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
                                                        title="Delete"
                                                    >
                                                        {deletingId === material.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* PAGINATION FOOTER CONTROL BAR */}
                    {!isLoading && filteredMaterials.length > 0 && (
                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between sm:px-6">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 tracking-wide">
                                        Showing <span className="font-semibold text-slate-700">{startIndex + 1}</span> to{" "}
                                        <span className="font-semibold text-slate-700">
                                            {Math.min(startIndex + ITEMS_PER_PAGE, filteredMaterials.length)}
                                        </span>{" "}
                                        of <span className="font-semibold text-slate-700">{filteredMaterials.length}</span> materials
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-xl shadow-sm gap-1" aria-label="Pagination">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center p-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`relative inline-flex items-center px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-150 active:scale-95 ${page === currentPage
                                                    ? "z-10 bg-[var(--color-main)] border-[var(--color-main)] text-white"
                                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center p-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}