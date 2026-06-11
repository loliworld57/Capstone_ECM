import React, { useEffect, useState } from 'react';
import api from '@/utils/axiosConfig';
import { Loader2 } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import toast from 'react-hot-toast';
import { useGradebookItems } from './GradebookItem';

interface CreateQuizModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: number;
    existingMaterials: any[];
    quizIdToEdit?: number | null;
}

export default function CreateQuizModal({ isOpen, onClose, courseId, existingMaterials, quizIdToEdit }: CreateQuizModalProps) {

    const [sourceType, setSourceType] = useState<'existing' | 'upload'>('existing');
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [title, setTitle] = useState<string>('');
    const [dueDate, setDueDate] = useState<string>('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const [generatedQuestions, setGeneratedQuestions] = useState<any[] | null>(null);

    // 2. Quiz Settings State
    const [questionCount, setQuestionCount] = useState<number>(10);
    const [maxAttempts, setMaxAttempts] = useState<number>(1); // 0 = unlimited
    const [isGraded, setIsGraded] = useState<boolean>(true);

    const [isGenerating, setIsGenerating] = useState(false);

    const { gradebookItems } = useGradebookItems(courseId);
    const [scoreItemId, setScoreItemId] = useState<number | "">("");

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText?: string;
        onConfirm: () => void;
    } | null>(null);

    const closeModalConfig = () => setModalConfig(null);

    // Bypasses generation if editing an existing quiz
    useEffect(() => {
        const loadQuizForEditing = async () => {
            if (!quizIdToEdit) {
                setIsEditMode(false);
                setGeneratedQuestions(null);
                setTitle('');
                setDueDate('');
                setMaxAttempts(1);
                setIsGraded(true);
                setScoreItemId("");
                return;
            }

            setIsEditMode(true);
            setIsGenerating(true);

            try {
                const response = await api.get(`/quizzes/${quizIdToEdit}`);
                const quizData = response.data;

                setTitle(quizData.title);
                setQuestionCount(quizData.questions?.length || 10);
                setMaxAttempts(quizData.maxAttempts);
                setIsGraded(quizData.isGraded);
                setScoreItemId(quizData.scoreItemId || "");

                if (quizData.dueDate) {
                    setDueDate(quizData.dueDate.substring(0, 16));
                }

                const mappedQuestions = (quizData.questions || []).map((q: any) => ({
                    id: q.id,
                    question: q.questionText,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation
                }));

                // Crucial: Setting this skips the generation view and sends the user directly to the preview editor
                setGeneratedQuestions(mappedQuestions);

            } catch (error: any) {
                console.error("Failed to load quiz details:", error);
                toast.error("Could not load quiz information.");
                onClose();
            } finally {
                setIsGenerating(false);
            }
        };

        if (isOpen) {
            loadQuizForEditing();
        }
    }, [quizIdToEdit, isOpen]);

    const handleGenerateClick = async () => {
        setIsGenerating(true);
        try {
            let payload: any = { questionCount };

            if (sourceType === 'existing') {
                if (!selectedMaterialId) {
                    setModalConfig({
                        isOpen: true,
                        title: "Missing Material",
                        message: "Please select a course material first before attempting to generate the quiz.",
                        confirmText: "Understood",
                        onConfirm: closeModalConfig
                    });
                    setIsGenerating(false);
                    return;
                }
                payload.materialId = Number(selectedMaterialId);
            }
            else if (sourceType === 'upload') {
                if (!uploadFile) {
                    setModalConfig({
                        isOpen: true,
                        title: "No File Selected",
                        message: "Please upload a document first before asking the AI to generate a preview.",
                        confirmText: "Understood",
                        onConfirm: closeModalConfig
                    });
                    setIsGenerating(false);
                    return;
                }

                setModalConfig({
                    isOpen: true,
                    title: "Coming Soon",
                    message: "Direct file upload parsing is coming up next! Let's complete testing existing materials first.",
                    confirmText: "OK",
                    onConfirm: closeModalConfig
                });
                setIsGenerating(false);
                return;
            }

            const response = await api.post('/quizzes/generate', payload, { timeout: 60000 });
            setGeneratedQuestions(response.data);

        } catch (error: any) {
            console.error("Failed to generate quiz:", error);
            setModalConfig({
                isOpen: true,
                title: "Generation Error",
                message: error.message || "An unexpected issue occurred while Gemini was crafting your questions.",
                confirmText: "Try Again",
                onConfirm: closeModalConfig
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePublishClick = async () => {
        if (!title || !dueDate) {
            setModalConfig({
                isOpen: true,
                title: "Missing Details",
                message: "A title and a valid due date are strictly required before you can save this quiz.",
                confirmText: "Fix Details",
                onConfirm: closeModalConfig
            });
            return;
        }

        setIsPublishing(true);
        try {
            const payload = {
                title: title,
                courseId: courseId,
                materialId: sourceType === 'existing' && !isEditMode ? Number(selectedMaterialId) : null,
                maxAttempts: maxAttempts,
                isGraded: isGraded,
                scoreItemId: scoreItemId || null, // Included in payload on submission
                dueDate: dueDate.length === 16 ? `${dueDate}:00` : dueDate,
                questions: generatedQuestions
            };

            if (isEditMode) {
                await api.put(`/quizzes/${quizIdToEdit}`, payload);
            } else {
                await api.post('/quizzes/create', payload);
            }

            setModalConfig({
                isOpen: true,
                title: "Success!",
                message: isEditMode
                    ? "🎉 Your changes have been successfully updated in the database."
                    : "🎉 Your AI Quiz has been successfully generated and published.",
                confirmText: "Back to Course",
                onConfirm: () => {
                    closeModalConfig();
                    onClose();
                }
            });

        } catch (error: any) {
            console.error("Failed to save quiz:", error);
            setModalConfig({
                isOpen: true,
                title: "Save Failed",
                message: error.message || "The server refused to update the quiz metrics.",
                confirmText: "Dismiss",
                onConfirm: closeModalConfig
            });
        } finally {
            setIsPublishing(false);
        }
    };

    const isCorrectAnswer = (optionText: string, correctAnswer: string) => {
        if (!optionText || !correctAnswer) return false;
        const clean = (str: string) => str.toLowerCase().replace(/\s+/g, '');
        const cleanOpt = clean(optionText);
        const cleanCorrect = clean(correctAnswer);

        if (cleanOpt === cleanCorrect) return true;
        if (cleanOpt.endsWith(cleanCorrect) || cleanCorrect.endsWith(cleanOpt)) return true;

        const stripPrefix = (str: string) => str.replace(/^[a-d][\.\s\-:\/)]+/i, '');
        return clean(stripPrefix(optionText)) === clean(stripPrefix(correctAnswer));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-xl">

                {modalConfig && (
                    <ConfirmModal
                        isOpen={modalConfig.isOpen}
                        title={modalConfig.title}
                        message={modalConfig.message}
                        confirmText={modalConfig.confirmText || "Confirm"}
                        onClose={closeModalConfig}
                        onConfirm={modalConfig.onConfirm}
                    />
                )}

                {/* SHOW GENERATION POPUP ONLY IF NOT IN PREVIEW/EDIT MODE */}
                {isGenerating && !generatedQuestions ? (
                    <div className="p-12 text-center text-gray-500">
                        <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
                        <p className="font-semibold text-gray-700">Loading quiz structural layouts...</p>
                    </div>
                ) : !generatedQuestions ? (
                    <>
                        <h2 className="text-2xl font-bold mb-4">✨ Create AI Quiz</h2>
                        <div className="flex gap-4 mb-6 border-b pb-2">
                            <button
                                className={`font-semibold ${sourceType === 'existing' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                                onClick={() => setSourceType('existing')}
                            >
                                Use Existing Material
                            </button>
                            <button
                                className={`font-semibold ${sourceType === 'upload' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                                onClick={() => setSourceType('upload')}
                            >
                                Upload New File
                            </button>
                        </div>

                        <div className="mb-6">
                            {sourceType === 'existing' ? (
                                <select
                                    className="w-full border p-2 rounded text-gray-800 bg-white"
                                    value={selectedMaterialId}
                                    onChange={(e) => setSelectedMaterialId(e.target.value)}
                                >
                                    <option value="">-- Select a Course Material --</option>
                                    {existingMaterials.map(mat => (
                                        <option key={mat.id} value={mat.id}>
                                            {mat.title || mat.fileName}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="border-2 border-dashed border-gray-300 p-8 text-center rounded bg-gray-50 cursor-pointer">
                                    <p className="text-gray-500">Drag & drop your document here, or click to browse</p>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded border">
                            <div>
                                <label className="block text-sm font-bold mb-1">Number of Questions: {questionCount}</label>
                                <input
                                    type="range"
                                    min="5" max="20"
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Attempts Allowed</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={maxAttempts}
                                    onChange={(e) => setMaxAttempts(Number(e.target.value))}
                                >
                                    <option value={1}>1 (Strict Exam)</option>
                                    <option value={2}>2</option>
                                    <option value={3}>3</option>
                                    <option value={0}>Unlimited</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={onClose} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100">
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerateClick}
                                disabled={isGenerating || (sourceType === 'existing' && !selectedMaterialId)}
                                className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                Generate Preview
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col max-h-[75vh]">
                        <h2 className="text-2xl font-bold mb-4 flex-shrink-0 text-gray-800">
                            {isEditMode ? "Edit Quiz Details" : "Review & Publish Quiz"}
                        </h2>

                        {/* CONFIGURATION EDITOR VIEW PANEL */}
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex-shrink-0 text-gray-800 space-y-4 mb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Quiz Title <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full border p-2 rounded-lg bg-white"
                                        placeholder="e.g., Chapter 4 Evaluation Exam"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Due Date <span className="text-red-500">*</span></label>
                                    <input
                                        type="datetime-local"
                                        className="w-full border p-2 rounded-lg bg-white"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-blue-200/60 pt-3">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Attempts Allowed</label>
                                    <select
                                        className="w-full border p-2 rounded-lg bg-white text-sm"
                                        value={maxAttempts}
                                        onChange={(e) => setMaxAttempts(Number(e.target.value))}
                                    >
                                        <option value={1}>1 (Strict Exam)</option>
                                        <option value={2}>2</option>
                                        <option value={3}>3</option>
                                        <option value={0}>Unlimited Attempts</option>
                                    </select>
                                </div>

                                {/* POSITIONED DROPDOWN HERE IN THE PREVIEW EDITOR SCREEN */}
                                <div>
                                    <label className="block text-sm font-bold mb-1">Link to Gradebook Column</label>
                                    <select
                                        value={scoreItemId}
                                        onChange={(e) => setScoreItemId(e.target.value ? Number(e.target.value) : "")}
                                        className="w-full border p-2 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">-- Do Not Link (Ungraded Practice) --</option>
                                        {gradebookItems.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="isGraded"
                                    checked={isGraded}
                                    onChange={(e) => setIsGraded(e.target.checked)}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="isGraded" className="font-semibold text-sm select-none">
                                    Count submissions towards overall class average calculations
                                </label>
                            </div>
                        </div>

                        {/* --- SCROLLABLE QUESTIONS INJECTOR LIST --- */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-6 mb-4 text-gray-800 scrollbar-thin">
                            {generatedQuestions.map((q, index) => (
                                <div key={index} className="p-5 border border-gray-200 rounded-xl bg-gray-50/50 shadow-sm relative">
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                                            Question {index + 1}
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full font-bold text-base p-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={q.question}
                                            onChange={(e) => {
                                                const updated = [...generatedQuestions];
                                                updated[index].question = e.target.value;
                                                setGeneratedQuestions(updated);
                                            }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                        {q.options.map((opt: string, i: number) => {
                                            const isCorrect = isCorrectAnswer(opt, q.correctAnswer);
                                            return (
                                                <div
                                                    key={i}
                                                    className={`p-2 rounded-xl border transition flex items-center gap-2 ${isCorrect
                                                        ? "bg-green-50 border-green-500 text-green-900 shadow-sm ring-1 ring-green-500"
                                                        : "bg-white border-gray-200 text-gray-700 focus-within:border-blue-400"
                                                        }`}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = [...generatedQuestions];
                                                            const cleanOptionValue = opt.replace(/^[a-d][\.\s\-:\/)]+/i, '').trim();
                                                            updated[index].correctAnswer = cleanOptionValue;
                                                            setGeneratedQuestions(updated);
                                                        }}
                                                        className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-xs transition ${isCorrect
                                                            ? "bg-green-600 text-white shadow-sm scale-105"
                                                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                            }`}
                                                    >
                                                        {String.fromCharCode(65 + i)}
                                                    </button>
                                                    <input
                                                        type="text"
                                                        className={`w-full bg-transparent p-1 text-sm outline-none font-medium ${isCorrect ? "font-semibold text-green-950" : ""}`}
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const updated = [...generatedQuestions];
                                                            const oldOptionValue = updated[index].options[i];
                                                            updated[index].options[i] = e.target.value;

                                                            if (isCorrectAnswer(oldOptionValue, q.correctAnswer)) {
                                                                const cleanNewValue = e.target.value.replace(/^[a-d][\.\s\-:\/)]+/i, '').trim();
                                                                updated[index].correctAnswer = cleanNewValue;
                                                            }
                                                            setGeneratedQuestions(updated);
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="bg-white border border-gray-100 p-3 rounded-xl">
                                        <label className="block text-xs font-bold text-green-700 mb-1">💡 AI Explanation</label>
                                        <textarea
                                            className="w-full text-xs text-gray-600 bg-transparent border-0 outline-none resize-none focus:ring-1 focus:ring-gray-200 rounded p-1"
                                            rows={2}
                                            value={q.explanation}
                                            onChange={(e) => {
                                                const updated = [...generatedQuestions];
                                                updated[index].explanation = e.target.value;
                                                setGeneratedQuestions(updated);
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* STICKY FOOTER ACTIONS */}
                        <div className="flex justify-end gap-3 border-t pt-4 bg-white flex-shrink-0">
                            {!isEditMode ? (
                                <button
                                    onClick={() => setGeneratedQuestions(null)}
                                    disabled={isPublishing}
                                    className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 font-medium"
                                >
                                    Discard & Try Again
                                </button>
                            ) : (
                                <button
                                    onClick={onClose}
                                    disabled={isPublishing}
                                    className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={handlePublishClick}
                                disabled={isPublishing}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-md transition flex items-center gap-2"
                            >
                                {isPublishing ? <Loader2 className="animate-spin" size={18} /> : null}
                                {isPublishing ? "Saving..." : isEditMode ? "Save Changes" : "Publish Quiz"}
                            </button>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}