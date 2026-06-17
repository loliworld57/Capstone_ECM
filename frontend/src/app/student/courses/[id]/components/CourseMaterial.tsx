"use client";

import { useState, useEffect } from "react";
import {
    BookOpen,
    Search,
    FileText,
    Video,
    File,
    Download,
    Loader2,
    X,
    Eye,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import api from '@/utils/axiosConfig';
import AiSummaryModalStudent from "./AiSummaryModalStudent";

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

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);

    const [isAiSummaryModalOpen, setIsAiSummaryModalOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

    const openSummaryModal = (material: Material) => {
        setSelectedMaterial(material);
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

    return (
        <div className="bg-[var(--color-soft-white)] rounded-xl border border-slate-100 shadow-md overflow-hidden transition-all duration-300 mt-6">

            {/* --- AI SUMMARY MODAL --- */}
            {isAiSummaryModalOpen && selectedMaterial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/70">
                            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <span className="text-amber-500">✨</span>
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
                            <AiSummaryModalStudent
                                materialId={selectedMaterial.id}
                                existingSummary={selectedMaterial.summary}
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
                                <th className="p-4 w-32 text-center">Actions</th>
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

                                                {material.summary != null && (
                                                    <button
                                                        onClick={() => openSummaryModal(material)}
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 hover:border-emerald-200 px-2.5 py-1.5 rounded-xl transition-all duration-200 shadow-sm active:scale-95"
                                                        title="View Summary"
                                                    >
                                                        <Eye size={14} />
                                                        <span>View</span>
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
                                                className={`relative inline-flex items-center px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-150 active:scale-95 ${
                                                    page === currentPage
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