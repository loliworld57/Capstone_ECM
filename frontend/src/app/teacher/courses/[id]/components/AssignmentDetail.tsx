import React, { useState } from 'react';
import { X, Calendar, Clock, Paperclip, Download, Edit3, UploadCloud } from 'lucide-react';
import AssignmentForm from './AddAssignmentForm';

interface Assignment {
    id: number;
    title: string;
    description?: string;
    fileName?: string | null;
    fileUrl?: string | null;
    createdDate: string;
    dueDate: string;
}

interface AssignmentDetailModalProps {
    courseId: number;
    assignment: Assignment;
    readOnly?: boolean; // If student, readOnly = true (no Edit button)
    onClose: () => void;
    onRefresh: () => void; // Called after successful Edit
}

export default function AssignmentDetailModal({
    courseId,
    assignment,
    readOnly = false,
    onClose,
    onRefresh
}: AssignmentDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false);

    // Format date and time
    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const isOverdue = new Date(assignment.dueDate).getTime() < new Date().getTime();

    // Student Submit action handler placeholder
    const handleStudentSubmit = () => {
        console.log("Navigate to submission screen or open submit dropzone/modal logic here");
    };

    // If in Edit mode, render Form instead of View
    if (isEditing) {
        return (
            <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="mt-20 bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                        <h2 className="font-bold text-gray-800 text-lg">Edit Assignment</h2>
                    </div>
                    <AssignmentForm
                        courseId={courseId}
                        initialData={assignment} // Pass old data for Editing
                        onSuccess={() => { setIsEditing(false); onRefresh(); }}
                        onCancel={() => setIsEditing(false)}
                    />
                </div>
            </div>
        );
    }

    // View details mode
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header (Different color if Overdue) */}
                <div className={`p-6 text-white flex justify-between items-start ${isOverdue ? 'bg-[var(--color-alert)]/80' : 'bg-[var(--color-main)]'}`}>
                    <div>
                        <h2 className="text-2xl font-bold mb-2">{assignment.title}</h2>
                        <div className="flex gap-4 text-sm font-medium opacity-90">
                            <span className="flex items-center gap-1">
                                <Calendar size={16} /> Created: {formatDateTime(assignment.createdDate)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={16} /> Due: {formatDateTime(assignment.dueDate)}
                                {isOverdue && (
                                    <span className="ml-2 px-2 py-0.5 bg-white text-red-600 text-xs font-bold rounded">
                                        OVERDUE
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {!readOnly && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
                                title="Edit"
                            >
                                <Edit3 size={20} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">Instructions</h3>
                    <div className="text-gray-600 whitespace-pre-wrap min-h-[100px] leading-relaxed">
                        {assignment.description || (
                            <span className="italic text-gray-400">No additional instructions provided.</span>
                        )}
                    </div>

                    {/* Attached file */}
                    {assignment.fileName && (
                        <div className="mt-6">
                            <h3 className="text-sm font-bold text-gray-800 mb-2">Attached Document</h3>
                            <a
                                href={assignment.fileUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-[var(--color-main)] hover:shadow-md transition group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Paperclip size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 group-hover:text-[var(--color-main)] transition">
                                            {assignment.fileName}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">Click to view or download</p>
                                    </div>
                                </div>
                                <Download size={20} className="text-gray-400 group-hover:text-[var(--color-main)]" />
                            </a>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t bg-white flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition text-sm shadow-sm"
                    >
                        Close
                    </button>
                    {readOnly && (
                        <button
                            onClick={handleStudentSubmit}
                            disabled={isOverdue}
                            className="px-6 py-2.5 bg-[var(--color-main)] text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2 text-sm shadow-sm"
                        >
                            <UploadCloud size={16} />
                            Submit Assignment
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}