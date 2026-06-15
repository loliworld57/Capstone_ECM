import React, { useEffect, useState } from 'react';
import api from '@/utils/axiosConfig';
import { Loader2, Sparkles, FileUp, Files, HelpCircle, CheckCircle, Lightbulb, Copy } from 'lucide-react';
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

    // Quiz Settings State
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
                    ? "Your changes have been successfully updated."
                    : "Your AI Quiz has been generated and published.",
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
                    <div className="p-12 text-center text-[var(--color-text)]">
                        <Loader2 size={32} className="animate-spin text-[var(--color-main)] mx-auto mb-3" />
                        <p className="font-semibold text-[var(--color-text)]">Loading quiz structural layouts...</p>
                    </div>
                ) : !generatedQuestions ? (
                    <>
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)] flex items-center gap-2">
                            <Sparkles size={24} className="text-[var(--color-main)]" />
                            <span>Create AI Quiz</span>
                        </h2>

                        <div className="flex gap-4 mb-6 border-b pb-2">
                            <button
                                className={`font-semibold flex items-center gap-1.5 pb-2 transition-colors ${sourceType === 'existing' ? 'text-[var(--color-main)] border-b-2 border-[var(--color-main)]' : 'text-[var(--color-text)]'}`}
                                onClick={() => setSourceType('existing')}
                            >
                                <Files size={16} />
                                <span>Use Existing Material</span>
                            </button>
                            <button
                                className={`font-semibold flex items-center gap-1.5 pb-2 transition-colors ${sourceType === 'upload' ? 'text-[var(--color-main)] border-b-2 border-[var(--color-main)]' : 'text-[var(--color-text)]'}`}
                                onClick={() => setSourceType('upload')}
                            >
                                <FileUp size={16} />
                                <span>Upload New File</span>
                            </button>
                        </div>

                        <div className="mb-6">
                            {sourceType === 'existing' ? (
                                <select
                                    className="w-full border p-2 rounded text-[var(--color-text)] bg-white border-zinc-200"
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
                                <div className="border-2 border-dashed border-zinc-300 p-8 text-center rounded bg-zinc-50 cursor-pointer flex flex-col items-center justify-center gap-2">
                                    <FileUp size={24} className="text-[var(--color-text)]" />
                                    <p className="text-[var(--color-text)]">Drag & drop your document here, or click to browse</p>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6 bg-zinc-50 p-4 rounded border border-zinc-200 text-[var(--color-text)]">
                            <div>
                                <label className="block text-sm font-bold mb-1">Number of Questions: {questionCount}</label>
                                <input
                                    type="range"
                                    min="5" max="20"
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                                    className="w-full accent-[var(--color-main)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Attempts Allowed</label>
                                <select
                                    className="w-full border p-2 rounded border-zinc-200 bg-white"
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
                            <button onClick={onClose} className="px-4 py-2 border rounded text-[var(--color-text)] border-zinc-200 hover:bg-zinc-50 font-medium transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerateClick}
                                disabled={isGenerating || (sourceType === 'existing' && !selectedMaterialId)}
                                className="px-6 py-2 bg-[var(--color-main)] text-white rounded font-bold hover:brightness-110 disabled:opacity-50 flex items-center gap-2 transition-all"
                            >
                                <Sparkles size={16} />
                                <span>Generate Preview</span>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col max-h-[75vh]">
                        <h2 className="text-2xl font-bold mb-4 flex-shrink-0 text-[var(--color-text)]">
                            {isEditMode ? "Edit Quiz Details" : "Review & Publish Quiz"}
                        </h2>

                        {/* CONFIGURATION EDITOR VIEW PANEL */}
                        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex-shrink-0 text-[var(--color-text)] space-y-4 mb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Quiz Title <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full border p-2 rounded-lg bg-white border-zinc-200 text-[var(--color-text)]"
                                        placeholder="e.g., Chapter 4 Evaluation Exam"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Due Date <span className="text-rose-500">*</span></label>
                                    <input
                                        type="datetime-local"
                                        className="w-full border p-2 rounded-lg bg-white border-zinc-200 text-[var(--color-text)]"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-200 pt-3">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Attempts Allowed</label>
                                    <select
                                        className="w-full border p-2 rounded-lg bg-white text-sm border-zinc-200 text-[var(--color-text)]"
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
                                        className="w-full border p-2 rounded-lg text-sm bg-white border-zinc-200 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-main)]"
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
                                    className="w-4 h-4 rounded text-[var(--color-main)] focus:ring-[var(--color-main)] border-zinc-300 accent-[var(--color-main)]"
                                />
                                <label htmlFor="isGraded" className="font-semibold text-sm select-none text-[var(--color-text)]">
                                    Count submissions towards overall class average calculations
                                </label>
                            </div>
                        </div>

                        {/* --- SCROLLABLE QUESTIONS INJECTOR LIST --- */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-6 mb-4 text-[var(--color-text)] scrollbar-thin border border-zinc-100 rounded-xl p-2">
                            {generatedQuestions.map((q, index) => (
                                <div key={index} className="p-5 border border-zinc-200 rounded-xl bg-zinc-50 shadow-xs relative">
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text)] mb-1">
                                            Question {index + 1}
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full font-bold text-base p-2 border rounded-lg bg-white border-zinc-200 text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-main)] outline-none"
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
                                            // DYNAMICALLY REMOVE ANY HARDCODED "A.", "B.", "C.", "D." PREFIXES FROM CURRENT TEXT
                                            const cleanedOptionText = opt.replace(/^[a-d][\.\s\-:\/)]+/i, '').trim();

                                            return (
                                                <div
                                                    key={i}
                                                    className={`p-2 rounded-xl border transition flex items-center gap-2 min-h-[44px] ${isCorrect
                                                        ? "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-500"
                                                        : "bg-white border-zinc-200 text-[var(--color-text)] focus-within:border-[var(--color-main)]"
                                                        }`}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = [...generatedQuestions];
                                                            updated[index].correctAnswer = cleanedOptionText;
                                                            setGeneratedQuestions(updated);
                                                        }}
                                                        className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-xs transition self-center ${isCorrect
                                                            ? "bg-emerald-600 text-white shadow-xs scale-105"
                                                            : "bg-zinc-100 text-[var(--color-text)] hover:bg-zinc-200"
                                                            }`}
                                                    >
                                                        {String.fromCharCode(65 + i)}
                                                    </button>
                                                    <input
                                                        type="text"
                                                        className={`w-full bg-transparent p-1 text-sm outline-none font-medium self-center ${isCorrect ? "font-semibold text-emerald-950" : "text-[var(--color-text)]"}`}
                                                        value={cleanedOptionText}
                                                        onChange={(e) => {
                                                            const updated = [...generatedQuestions];
                                                            const oldOptionValue = updated[index].options[i];
                                                            updated[index].options[i] = e.target.value;

                                                            if (isCorrectAnswer(oldOptionValue, q.correctAnswer)) {
                                                                updated[index].correctAnswer = e.target.value.replace(/^[a-d][\.\s\-:\/)]+/i, '').trim();
                                                            }
                                                            setGeneratedQuestions(updated);
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* EXPANDABLE AI EXPLANATION BOX FEATURING AN INTEGRATED COPY ACTION BUTTON */}
                                    <div className="bg-white border border-zinc-200 p-3 rounded-xl flex flex-col gap-2 relative group">
                                        <div className="flex items-center justify-between border-b border-zinc-50 pb-1">
                                            <label className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                                                <Lightbulb size={14} />
                                                <span>AI Explanation</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => navigator.clipboard.writeText(q.explanation || '')}
                                                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100 transition-all flex items-center gap-1 text-[10px] font-medium"
                                                title="Copy text"
                                            >
                                                <Copy size={12} />
                                                <span>Copy</span>
                                            </button>
                                        </div>

                                        {/* Custom Expandable Rich Content Field replacing Textarea */}
                                        <div
                                            contentEditable
                                            suppressContentEditableWarning
                                            className="w-full text-xs text-[var(--color-text)] bg-transparent border-0 outline-none min-h-[40px] h-auto p-1 leading-relaxed whitespace-pre-wrap break-words focus:ring-1 focus:ring-zinc-100 rounded"
                                            onBlur={(e) => {
                                                const updated = [...generatedQuestions];
                                                updated[index].explanation = e.currentTarget.textContent || '';
                                                setGeneratedQuestions(updated);
                                            }}
                                        >
                                            {q.explanation}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* STICKY FOOTER ACTIONS */}
                        <div className="flex justify-end gap-3 border-t pt-4 border-zinc-200 bg-white flex-shrink-0">
                            {!isEditMode ? (
                                <button
                                    onClick={() => setGeneratedQuestions(null)}
                                    disabled={isPublishing}
                                    className="px-4 py-2 border rounded-lg text-[var(--color-text)] border-zinc-200 hover:bg-zinc-50 font-medium transition-colors"
                                >
                                    Discard & Try Again
                                </button>
                            ) : (
                                <button
                                    onClick={onClose}
                                    disabled={isPublishing}
                                    className="px-4 py-2 border rounded-lg text-[var(--color-text)] border-zinc-200 hover:bg-zinc-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={handlePublishClick}
                                disabled={isPublishing}
                                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:brightness-110 shadow-xs transition flex items-center gap-2"
                            >
                                {isPublishing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                <span>{isPublishing ? "Saving..." : isEditMode ? "Save Changes" : "Publish Quiz"}</span>
                            </button>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}