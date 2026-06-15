import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, X, Loader2, Save, Calendar, Type, AlignLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/utils/axiosConfig';
import { useGradebookItems } from './GradebookItem';

interface AssignmentFormProps {
    courseId: number;
    classSessionId?: number;
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function AssignmentForm({ courseId, classSessionId, initialData, onSuccess, onCancel }: AssignmentFormProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [existingFileName, setExistingFileName] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const isEditMode = !!initialData;

    const { gradebookItems } = useGradebookItems(courseId);
    const [scoreItemId, setScoreItemId] = useState<number | "">("");

    // Load old data if in Edit mode
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || "");
            setDescription(initialData.description || "");
            setExistingFileName(initialData.fileName || null);
            setScoreItemId(initialData.scoreItemId || "");

            // Format ISO string to datetime-local format (YYYY-MM-DDThh:mm)
            if (initialData.dueDate) {
                const dateObj = new Date(initialData.dueDate);
                // Adjust for local timezone for the input field
                dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
                setDueDate(dateObj.toISOString().slice(0, 16));
            }
        }
    }, [initialData]);

    const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === "dragenter" || e.type === "dragover"); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setExistingFileName(null); // Overwrite old file
        }
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setExistingFileName(null); // Overwrite old file
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !dueDate) {
            toast.error("Please enter a title and due date!");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);

            const isoDueDate = new Date(dueDate).toISOString();
            formData.append("dueDate", isoDueDate);
            formData.append("courseId", courseId.toString());

            if (scoreItemId) {
                formData.append("scoreItemId", scoreItemId.toString());
            }

            if (classSessionId) formData.append("classSessionId", classSessionId.toString());
            if (file) formData.append("file", file);

            if (isEditMode) {
                await api.put(`/assignments/${initialData.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success("Assignment updated successfully!");
            } else {
                await api.post('/assignments', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success("Assignment created successfully!");
            }
            onSuccess();
        } catch (error: any) {
            console.error("Error:", error);
            toast.error(error.response?.data?.message || "An error occurred while saving the assignment.");
        } finally {
            setLoading(false);
        }
    };

    return (
        /* 1. Added full screen boundary limit constraints and flex direction */
        <form 
            onSubmit={handleSubmit} 
            className="flex flex-col w-full max-h-[85vh] md:max-h-[80vh] bg-white rounded-xl shadow-lg overflow-hidden"
        >


            {/* 2. Scrollable Body Content Wrapper */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                
                {/* TITLE */}
                <div>
                    <label className="block text-sm font-bold text-[var(--color-text)] mb-1 flex items-center gap-2">
                        <Type size={16} className="text-[var(--color-main)]" /> Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        required type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 border-2 border-[var(--color-main)]/50 rounded-lg focus:border-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-main)]/20 outline-none transition text-sm"
                        placeholder="Ex: Homework 1"
                    />
                </div>

                {/* DESCRIPTION */}
                <div>
                    <label className="block text-sm font-bold text-[var(--color-text)] mb-1 flex items-center gap-2">
                        <AlignLeft size={16} className="text-[var(--color-main)]" /> Instructions / Description
                    </label>
                    <textarea
                        rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 border-2 border-[var(--color-main)]/50 rounded-lg focus:border-[var(--color-main)] outline-none transition text-sm"
                        placeholder="Write detailed instructions for students here..."
                    />
                </div>

                {/* TWO COLUMN GRID FOR METADATA TO COMPACT HEIGHT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* DUE DATE */}
                    <div>
                        <label className="block text-sm font-bold text-[var(--color-text)] mb-1 flex items-center gap-2">
                            <Calendar size={16} className="text-[var(--color-main)]" /> Due Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            required type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                            className="w-full p-2 border-2 border-[var(--color-main)]/50 rounded-lg focus:border-[var(--color-main)] outline-none transition bg-white text-sm"
                        />
                    </div>

                    {/* LINK TO GRADEBOOK COLUMN */}
                    <div>
                        <label className="block text-sm font-bold text-[var(--color-text)] mb-1 flex items-center gap-2">
                            <FileText size={16} className="text-[var(--color-main)]" /> Gradebook Association
                        </label>
                        <select
                            value={scoreItemId}
                            onChange={(e) => setScoreItemId(e.target.value ? Number(e.target.value) : "")}
                            className="w-full border-2 border-gray-200 p-2 rounded-lg text-sm bg-white outline-none focus:border-[var(--color-main)] transition h-[42px]"
                        >
                            <option value="">-- No Gradebook Association --</option>
                            {gradebookItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ATTACH FILE (OPTIONAL) */}
                <div>
                    <label className="block text-sm font-bold text-[var(--color-text)] mb-1.5">
                        Attached File (PDF, DOCX...) - Optional
                    </label>

                    {/* Decreased zone height from h-32 to h-24 for layout safety */}
                    <div
                        className={`relative w-full h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer
                            ${dragActive ? "border-[var(--color-main)] bg-[var(--color-main)]/10" : "border-gray-300 bg-gray-50 hover:border-[var(--color-main)]"}
                            ${(file || existingFileName) ? "border-green-500 bg-green-50" : ""}
                        `}
                        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                    >
                        <input ref={inputRef} type="file" onChange={handleChange} className="hidden" />

                        {(file || existingFileName) ? (
                            <div className="flex flex-col items-center text-center p-2">
                                <FileText size={22} className="text-green-600 mb-1" />
                                <p className="font-bold text-[var(--color-text)] line-clamp-1 max-w-[250px] text-xs">
                                    {file ? file.name : existingFileName}
                                </p>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setFile(null); setExistingFileName(null); }}
                                    className="mt-1 text-red-500 text-xs font-bold hover:underline"
                                >
                                    Remove attached file
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-gray-400">
                                <UploadCloud size={24} className="mb-1" />
                                <p className="font-medium text-xs text-gray-500">Drag & drop or click to select file</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Sticky Action Footer Bar (Will never slip off screen) */}
            <div className="flex justify-end gap-3 px-6 py-3.5 bg-gray-50 border-t border-gray-100 shrink-0">
                <button 
                    type="button" 
                    onClick={onCancel} 
                    className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="px-5 py-2 text-sm font-bold text-white bg-[var(--color-main)] rounded-lg hover:opacity-90 transition flex items-center gap-2 shadow-sm disabled:opacity-60"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isEditMode ? "Update Assignment" : "Create Assignment"}
                </button>
            </div>
        </form>
    );
}