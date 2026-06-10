import React, { useEffect, useState } from 'react';
import api from '@/utils/axiosConfig';
import { Loader2 } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import toast from 'react-hot-toast';

// Adjust these props based on your actual data structures
interface CreateQuizModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: number;
    existingMaterials: any[];
    quizIdToEdit?: number | null;
}

export default function CreateQuizModal({ isOpen, onClose, courseId, existingMaterials, quizIdToEdit }: CreateQuizModalProps) {
    // 1. Material Source State
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

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText?: string;
        onConfirm: () => void;
    } | null>(null);

    const closeModalConfig = () => setModalConfig(null);

    const handleGenerateClick = async () => {
        setIsGenerating(true);
        try {
            let payload: any = { questionCount };

            // Handle Option A: Existing Material
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
            // Handle Option B: Upload New File
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

            const response = await api.post('/quizzes/generate', payload, {
                timeout: 60000
            });

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
                materialId: sourceType === 'existing' ? Number(selectedMaterialId) : null,
                maxAttempts: maxAttempts,
                isGraded: isGraded,
                dueDate: dueDate.length === 16 ? `${dueDate}:00` : dueDate,
                questions: generatedQuestions
            };

            if (isEditMode) {
                // Route to PUT update channel
                await api.put(`/quizzes/${quizIdToEdit}`, payload);
            } else {
                // Route to original POST creation channel
                await api.post('/quizzes/create', payload);
            }

            // Success Popup configuration
            setModalConfig({
                isOpen: true,
                title: "Success!",
                message: isEditMode
                    ? "🎉 Your changes have been successfully updated in the database."
                    : "🎉 Your AI Quiz has been successfully generated and published.",
                confirmText: "Back to Course",
                onConfirm: () => {
                    closeModalConfig();
                    onClose(); // Cleanly close out the creation modal view
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

    useEffect(() => {
        const loadQuizForEditing = async () => {
            if (!quizIdToEdit) {
                setIsEditMode(false);
                setGeneratedQuestions(null);
                setTitle('');
                setDueDate('');
                return;
            }

            setIsEditMode(true);
            setIsGenerating(true); // Re-use loader state for initial data fetch

            try {
                const response = await api.get(`/quizzes/${quizIdToEdit}`);
                const quizData = response.data;

                // Populate states with existing DB records
                setTitle(quizData.title);
                setQuestionCount(quizData.questions.length);
                setMaxAttempts(quizData.maxAttempts);
                setIsGraded(quizData.isGraded);

                // Format the LocalDateTime string (YYYY-MM-DDTHH:MM) for HTML input compatibility
                if (quizData.dueDate) {
                    setDueDate(quizData.dueDate.substring(0, 16));
                }

                // Map database question keys to match our AI question schema keys
                const mappedQuestions = quizData.questions.map((q: any) => ({
                    id: q.id, // Keep the DB primary key for updates
                    question: q.questionText,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation
                }));

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

    // Helper function to clean strings for robust matching
    const isCorrectAnswer = (optionText: string, correctAnswer: string) => {
        if (!optionText || !correctAnswer) return false;

        // 1. Convert everything to lowercase and strip all whitespace
        const clean = (str: string) => str.toLowerCase().replace(/\s+/g, '');

        const cleanOpt = clean(optionText);
        const cleanCorrect = clean(correctAnswer);

        // 2. Direct clean match check
        if (cleanOpt === cleanCorrect) return true;

        // 3. Partial match check: Handles case where Gemini leaves off the prefix 
        // or includes the prefix (like "A.", "B.", "A ") inside the correct answer string
        if (cleanOpt.endsWith(cleanCorrect) || cleanCorrect.endsWith(cleanOpt)) return true;

        // 4. Strip common structural prefixes (e.g., "a.", "b.", "c.", "d.") manually to compare core content
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
                {!generatedQuestions ? (
                    /* --- SHOW THE SETTINGS FORM YOU ALREADY BUILT --- */
                    <>
                        <h2 className="text-2xl font-bold mb-4">✨ Create AI Quiz</h2>
                        {/* --- MATERIAL SOURCE TABS --- */}
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

                        {/* --- MATERIAL SELECTION --- */}
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

                        {/* --- QUIZ SETTINGS --- */}
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
                            <div className="col-span-2 flex items-center gap-2 mt-2">
                                <input
                                    type="checkbox"
                                    id="isGraded"
                                    checked={isGraded}
                                    onChange={(e) => setIsGraded(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="isGraded" className="font-semibold text-sm">Count towards final gradebook</label>
                            </div>
                        </div>

                        {/* --- ACTIONS --- */}
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={onClose} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100">
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerateClick}
                                disabled={isGenerating || (sourceType === 'existing' && !selectedMaterialId)}
                                className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isGenerating ? "Analyzing..." : "Generate Preview"}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col max-h-[75vh]">
                        <h2 className="text-2xl font-bold mb-4 flex-shrink-0 flex items-center gap-2 text-gray-800">
                            Review & Publish Quiz
                        </h2>

                        {/* Final Settings Form (Title & Due Date) */}
                        <div className="flex gap-4 mb-4 bg-blue-50 p-4 rounded-xl border border-blue-100 flex-shrink-0 text-gray-800">
                            <div className="flex-1">
                                <label className="block text-sm font-bold mb-1">Quiz Title <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded-lg bg-white"
                                    placeholder="e.g., Chapter 4: Photosynthesis Quiz"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-bold mb-1">Due Date <span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    className="w-full border p-2 rounded-lg bg-white"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* --- SCROLLABLE CONTAINER FOR QUESTIONS --- */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-6 mb-4 text-gray-800 scrollbar-thin">
                            {generatedQuestions.map((q, index) => (
                                <div key={index} className="p-5 border border-gray-200 rounded-xl bg-gray-50/50 shadow-sm relative">

                                    {/* Question Input */}
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

                                    {/* Options Grid */}
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
                                                    {/* Visual Indicator Bubble - NOW FIXED FOR CLICK SELECTION */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = [...generatedQuestions];

                                                            // FIX: Strip any leading "A. ", "B. ", etc. from the string 
                                                            // before saving it as the correct answer. This ensures our 
                                                            // matching helper can instantly identify it!
                                                            const cleanOptionValue = opt.replace(/^[a-d][\.\s\-:\/)]+/i, '').trim();

                                                            updated[index].correctAnswer = cleanOptionValue;
                                                            setGeneratedQuestions(updated);
                                                        }}
                                                        className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-xs transition ${isCorrect
                                                            ? "bg-green-600 text-white shadow-sm scale-105"
                                                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                            }`}
                                                        title="Mark as correct answer"
                                                    >
                                                        {String.fromCharCode(65 + i)}
                                                    </button>

                                                    {/* Option Text Input */}
                                                    <input
                                                        type="text"
                                                        className={`w-full bg-transparent p-1 text-sm outline-none font-medium ${isCorrect ? "font-semibold text-green-950" : ""
                                                            }`}
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const updated = [...generatedQuestions];
                                                            const oldOptionValue = updated[index].options[i];
                                                            updated[index].options[i] = e.target.value;

                                                            // Sync correct answer if the text of the currently correct option is edited
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

                                    {/* Explanation Input */}
                                    <div className="bg-white border border-gray-100 p-3 rounded-xl">
                                        <label className="block text-xs font-bold text-green-700 mb-1">
                                            💡 AI Explanation
                                        </label>
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

                        {/* --- STICKY FOOTER ACTIONS --- */}
                        <div className="flex justify-end gap-3 border-t pt-4 bg-white flex-shrink-0">
                            <button
                                onClick={() => setGeneratedQuestions(null)}
                                disabled={isPublishing}
                                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 font-medium disabled:opacity-50"
                            >
                                Discard & Try Again
                            </button>
                            <button
                                onClick={handlePublishClick}
                                disabled={isPublishing}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-md transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {isPublishing ? <Loader2 className="animate-spin" size={18} /> : null}
                                {isPublishing ? "Saving..." : "Publish Quiz"}
                            </button>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}