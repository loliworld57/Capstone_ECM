"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, FileText, UploadCloud, File as FileIcon, Loader2, CheckCircle2, Clock, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/utils/axiosConfig';

export default function StudentAssignmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;
    const assignmentId = params.assignmentid as string;


    const [assignment, setAssignment] = useState<any>(null);
    const [submission, setSubmission] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // State cho nộp bài
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Lấy dữ liệu bài tập và bài nộp
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // 1. Lấy thông tin bài tập (Đề bài)
                const assignRes = await api.get(`/assignments/${assignmentId}`);
                setAssignment(assignRes.data);

                // 2. Lấy thông tin bài nộp của học sinh này (Nếu Backend có API này)
                // const user = JSON.parse(localStorage.getItem('user') || '{}');
                // const subRes = await api.get(`/assignments/${assignmentId}/submissions/student/${user.id}`);
                // setSubmission(subRes.data);

                // TẠM THỜI GIẢ LẬP DỮ LIỆU ĐỂ HIỂN THỊ UI (Giống trong ảnh Moodle)
                setSubmission(null); // Đổi thành null để thấy form nộp bài

            } catch (error) {
                console.error(error);
                toast.error("Failed to load assignment details.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [assignmentId]);

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const isOverdue = assignment ? new Date(assignment.dueDate).getTime() < new Date().getTime() : false;
    const isSubmitted = !!submission;

    // Tính toán thời gian còn lại (Time remaining)
    const getTimeRemaining = () => {
        if (!assignment) return "";
        const now = new Date().getTime();
        const due = new Date(assignment.dueDate).getTime();
        const diff = due - now;

        if (isSubmitted) {
            return "Assignment was submitted"; // Có thể tính thêm submitted sớm bao nhiêu ngày
        }

        if (diff < 0) {
            const overdueDays = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));
            const overdueHours = Math.floor((Math.abs(diff) / (1000 * 60 * 60)) % 24);
            return `Assignment is overdue by ${overdueDays} days and ${overdueHours} hours`;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        return `${days} days ${hours} hours`;
    };

    // Xử lý nộp file
    const handleSubmit = async () => {
        if (!file) {
            toast.error("Please attach a file to submit!");
            return;
        }

        setUploading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const formData = new FormData();
            formData.append('file', file);

            // API mẫu: /assignments/{id}/submit?studentId={id}
            await api.post(`/assignments/${assignmentId}/submit?studentId=${user.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success("Assignment submitted successfully!");
            // Refresh lại trang hoặc cập nhật state submission
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error("Error submitting assignment.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="p-10 text-center"><Loader2 size={32} className="animate-spin text-[var(--color-main)] mx-auto" /></div>;
    if (!assignment) return <div className="p-10 text-center">Assignment not found.</div>;

    return (
        <div className="max-w-5xl mx-auto pb-10">
            {/* Nút Quay Lại */}
            <button
                onClick={() => router.push(`/student/courses/${courseId}?tab=assignments`)}
                className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-[var(--color-main)] mb-6 transition"
            >
                <ChevronLeft size={16} /> Back to Course Assignments
            </button>

            {/* Header Đề bài */}
            <div className="bg-white rounded-t-xl border border-gray-200 border-b-0 p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">{assignment.title}</h1>

                <div className="bg-gray-50/80 rounded-lg p-5 border border-gray-100 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                            <Calendar size={18} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className="font-bold text-gray-700">Opened:</p>
                                <p className="text-gray-600">{formatDateTime(assignment.createdDate)}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Clock size={18} className={isOverdue && !isSubmitted ? "text-red-500 mt-0.5" : "text-gray-400 mt-0.5"} />
                            <div>
                                <p className="font-bold text-gray-700">Due:</p>
                                <p className={isOverdue && !isSubmitted ? "text-red-600 font-medium" : "text-gray-600"}>{formatDateTime(assignment.dueDate)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-6">
                    {assignment.description || <span className="italic text-gray-400">No instructions provided.</span>}
                </div>

                {/* File Đề bài đính kèm */}
                {assignment.fileUrl && (
                    <a
                        href={assignment.fileUrl}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 p-3 pr-5 bg-blue-50/50 border border-blue-100 rounded-lg hover:bg-blue-50 transition text-blue-700 group"
                    >
                        <FileIcon size={20} className="text-blue-500" />
                        <span className="font-medium text-sm group-hover:underline">{assignment.fileName}</span>
                    </a>
                )}
            </div>

            {/* Bảng Submission Status */}
            <div className="bg-white border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 p-6 border-b border-gray-200">Submission status</h2>

                <div className="divide-y divide-gray-200 text-sm">
                    {/* Hàng 1: Trạng thái nộp */}
                    <div className="flex flex-col md:flex-row">
                        <div className="p-4 font-bold text-gray-700 bg-gray-50/50 w-full md:w-1/3">Submission status</div>
                        <div className={`p-4 w-full md:w-2/3 font-medium ${isSubmitted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                            {isSubmitted ? "Submitted for grading" : "No attempt"}
                        </div>
                    </div>

                    {/* Hàng 2: Trạng thái chấm điểm */}
                    <div className="flex flex-col md:flex-row">
                        <div className="p-4 font-bold text-gray-700 bg-gray-50/50 w-full md:w-1/3">Grading status</div>
                        <div className="p-4 w-full md:w-2/3 text-gray-700">
                            {submission?.status === "GRADED" ? (
                                <span className="font-bold text-green-600">Graded (Score: {submission.score}/10)</span>
                            ) : "Not graded"}
                        </div>
                    </div>

                    {/* Hàng 3: Thời gian còn lại */}
                    <div className="flex flex-col md:flex-row">
                        <div className="p-4 font-bold text-gray-700 bg-gray-50/50 w-full md:w-1/3">Time remaining</div>
                        <div className={`p-4 w-full md:w-2/3 ${isOverdue && !isSubmitted ? 'bg-red-50 text-red-600 font-bold' : (isSubmitted ? 'bg-green-50 text-green-700' : 'text-gray-700')}`}>
                            {getTimeRemaining()}
                        </div>
                    </div>

                    {/* Hàng 4: File bài làm (Nếu đã nộp) */}
                    {isSubmitted && (
                        <div className="flex flex-col md:flex-row">
                            <div className="p-4 font-bold text-gray-700 bg-gray-50/50 w-full md:w-1/3">File submissions</div>
                            <div className="p-4 w-full md:w-2/3">
                                <a
                                    href={submission.fileUrl}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-600 hover:underline"
                                >
                                    <FileText size={16} /> {submission.fileName}
                                </a>
                                <p className="text-xs text-gray-500 mt-1">{formatDateTime(submission.submittedAt)}</p>
                            </div>
                        </div>
                    )}

                    {/* Hàng 5: Feedback của giáo viên */}
                    {(submission?.status === "GRADED" && submission?.feedback) && (
                        <div className="flex flex-col md:flex-row">
                            <div className="p-4 font-bold text-gray-700 bg-gray-50/50 w-full md:w-1/3">Teacher Comments</div>
                            <div className="p-4 w-full md:w-2/3 text-gray-800 italic bg-yellow-50/30">
                                "{submission.feedback}"
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Khu vực Upload / Chỉnh sửa nộp bài */}
            <div className="bg-white rounded-b-xl border border-gray-200 border-t-0 p-6 flex flex-col items-center">

                {(!isSubmitted || (isSubmitted && submission?.status !== "GRADED")) && (
                    <div className="w-full max-w-xl mx-auto mt-4 mb-6">
                        <input ref={inputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />

                        <div
                            onClick={() => inputRef.current?.click()}
                            className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all
                                ${file ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-[var(--color-main)]'}
                            `}
                        >
                            {file ? (
                                <div className="text-center">
                                    <FileText size={32} className="text-green-500 mx-auto mb-2" />
                                    <p className="font-bold text-green-700 text-sm">{file.name}</p>
                                    <p className="text-xs text-green-600 underline mt-1">Click to change file</p>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500">
                                    <UploadCloud size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="font-medium text-sm">Click or Drag & Drop to attach your work</p>
                                    <p className="text-xs mt-1 opacity-70">Supports PDF, DOCX, ZIP...</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex gap-4">
                    {/* Nếu đã nộp rồi nhưng chưa chấm điểm -> Nút Edit (Ghi đè file) */}
                    {isSubmitted && submission?.status !== "GRADED" && (
                        <button
                            onClick={handleSubmit}
                            disabled={uploading || !file}
                            className="px-6 py-2.5 bg-[var(--color-main)] text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                        >
                            {uploading ? <Loader2 size={18} className="animate-spin" /> : null}
                            Edit submission
                        </button>
                    )}

                    {/* Nếu chưa nộp -> Nút Add submission */}
                    {!isSubmitted && (
                        <button
                            onClick={handleSubmit}
                            disabled={uploading || !file}
                            className="px-6 py-2.5 bg-[var(--color-main)] text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                        >
                            {uploading ? <Loader2 size={18} className="animate-spin" /> : null}
                            Add submission
                        </button>
                    )}

                    {/* Nếu đã bị chấm điểm -> Không cho nộp lại nữa */}
                    {submission?.status === "GRADED" && (
                        <div className="px-6 py-2.5 bg-gray-100 text-gray-500 font-bold rounded-lg flex items-center gap-2">
                            <CheckCircle2 size={18} /> Assignment Graded - Cannot edit
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}