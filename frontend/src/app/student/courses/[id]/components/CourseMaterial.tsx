"use client";

import { useState, useEffect } from "react";
import {
    BookOpen,
    Search,
    Plus,
    FileText,
    Video,
    Link as LinkIcon,
    File,
    Download,
    Trash2,
    Loader2,
    X
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

export default function CourseMaterials({ courseId, readOnly = false }: Props) {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [keyword, setKeyword] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const [isAiSummaryModalOpen, setIsAiSummaryModalOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

    const openSummaryModal = (material: Material, startingState: "INPUT" | "REVIEW") => {
        setSelectedMaterial(material);
        setIsAiSummaryModalOpen(true);
    }
    // Fetch materials from the backend
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

    // Helper function to render the correct icon based on MIME type from backend
    const getFileIcon = (type: string) => {
        const lowerType = type?.toLowerCase() || "";
        if (lowerType.includes("pdf")) return <FileText size={18} className="text-red-500" />;
        if (lowerType.includes("video") || lowerType.includes("mp4")) return <Video size={18} className="text-blue-500" />;
        if (lowerType.includes("image")) return <File size={18} className="text-green-500" />;
        if (lowerType.includes("document") || lowerType.includes("msword")) return <FileText size={18} className="text-blue-600" />;
        return <File size={18} className="text-gray-500" />;
    };

    // Format LocalDateTime from Spring Boot
    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    };

    // Filter materials based on search keyword
    const filteredMaterials = materials.filter((m) =>
        m.fileName.toLowerCase().includes(keyword.toLowerCase())
    );


    return (
        <div className="bg-[var(--color-soft-white)] rounded-xl border border-[var(--color-main)] shadow-sm mt-6 overflow-hidden">

            {isAiSummaryModalOpen && selectedMaterial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-xl rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                            <h2 className="font-bold text-gray-800 text-lg">
                                ✨ AI Summary: {selectedMaterial.fileName}
                            </h2>
                            <button
                                onClick={() => setIsAiSummaryModalOpen(false)}
                                className="text-gray-500 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4">
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
            <div className="bg-[var(--color-main)] text-white px-6 py-4 flex items-center justify-between font-semibold">
                <div className="flex items-center gap-2">
                    <BookOpen size={18} />
                    Course Materials ({materials.length})
                </div>
            </div>

            <div className="p-6">
                {/* SEARCH BAR */}
                <div className="mb-6 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search materials by title..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 text-sm border-2 border-[var(--color-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-secondary)] outline-none transition"
                    />
                </div>

                {/* MATERIALS TABLE */}
                <div className="overflow-x-auto border border-[var(--color-main)] rounded-lg">
                    <table className="w-full text-left text-sm border-collapse bg-white">
                        <thead>
                            <tr className="bg-[var(--color-secondary)]/10 text-[var(--color-text)] border-b border-[var(--color-main)]">
                                <th className="p-4 font-semibold">Title</th>
                                <th className="p-4 font-semibold w-40">Date Added</th>
                                <th className="p-4 font-semibold w-24 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="text-center py-10">
                                        <Loader2 size={24} className="animate-spin text-[var(--color-main)] mx-auto mb-2" />
                                        <p className="text-gray-500">Loading materials...</p>
                                    </td>
                                </tr>
                            ) : filteredMaterials.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="text-center text-gray-500 py-10 border-dashed">
                                        {keyword ? "No materials match your search." : "No materials uploaded yet."}
                                    </td>
                                </tr>
                            ) : (
                                filteredMaterials.map((material) => (
                                    <tr
                                        key={material.id}
                                        className="border-b last:border-0 border-gray-200 hover:bg-[var(--color-secondary)]/5 transition group"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 flex-shrink-0">
                                                    {getFileIcon(material.fileType)}
                                                </div>
                                                <a
                                                    href={material.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-semibold text-[var(--color-text)] hover:text-[var(--color-main)] hover:underline transition line-clamp-1"
                                                >
                                                    {material.fileName}
                                                </a>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-500 font-medium">
                                            {formatDate(material.uploadedDate)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <a
                                                    href={material.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    download
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="View/Download"
                                                >
                                                    <Download size={18} />
                                                </a>
                                                {material.summary != null && (
                                                    <>
                                                        {/* Button 1: Just view the existing summary */}
                                                        <button
                                                            onClick={() => openSummaryModal(material, "REVIEW")}
                                                            className="text-green-600 hover:text-green-800 bg-green-50 px-2 py-1 rounded"
                                                        >
                                                            👁️ View
                                                        </button>

                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}