"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Building2, Calendar, Plus } from "lucide-react";
import { Center, CenterSubject, CenterGrade, getCenterSubjects, getCenterGrades } from "@/services/centerService";
import SubjectModal from "../../centers/[id]/components/SubjectModal";
import GradeModal from "../../centers/[id]/components/GradeModal";
import toast from "react-hot-toast";

export interface CourseFormData {
    name: string;
    subjectId?: number;
    gradeId?: number;
    description: string;
    startDate: string;
    endDate: string;
    centerId?: number;
    tuitionFeeVnd?: number;
}

interface Props {
    initialData?: CourseFormData;
    onSubmit: (data: CourseFormData) => void;
    onChange?: (data: CourseFormData) => void;
    loading: boolean;
    centers: Center[];
    isCenterLocked?: boolean;
    btnLabel?: string;
}

export default function CourseForm({
    initialData,
    onSubmit,
    onChange,
    loading,
    centers,
    isCenterLocked = false,
    btnLabel = "Save Course"
}: Props) {

    const defaultData: CourseFormData = {
        name: "",
        subjectId: undefined,
        gradeId: undefined,
        description: "",
        startDate: "",
        endDate: "",
        centerId: undefined,
        tuitionFeeVnd: 0,
    };

    const [formData, setFormData] = useState<CourseFormData>(defaultData);
    const [subjects, setSubjects] = useState<CenterSubject[]>([]);
    const [grades, setGrades] = useState<CenterGrade[]>([]);

    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<CenterSubject | null>(null);
    const [editingGrade, setEditingGrade] = useState<CenterGrade | null>(null);
    const hasAvailableCenterSelection = Boolean(formData.centerId) || centers.length > 0;
    const hasMountedRef = useRef(false);
    const skipNextOnChangeRef = useRef(false);

    const updateFormData = (
        updater: CourseFormData | ((prev: CourseFormData) => CourseFormData)
    ) => {
        setFormData((prev) =>
            typeof updater === "function" ? updater(prev) : updater
        );
    };

    const handleSubjectModalSuccess = (newSubject?: CenterSubject) => {
        if (formData.centerId) {
            fetchCenterOptions(formData.centerId);
        }
        if (newSubject) {
            updateFormData(prev => ({ ...prev, subjectId: newSubject.id }));
        }
        setIsSubjectModalOpen(false);
    };

    const handleGradeModalSuccess = (newGrade?: CenterGrade) => {
        if (formData.centerId) {
            fetchCenterOptions(formData.centerId);
        }
        if (newGrade) {
            updateFormData(prev => ({ ...prev, gradeId: newGrade.id }));
        }
        setIsGradeModalOpen(false);
    };

    const fetchCenterOptions = async (centerId?: number) => {
        if (!centerId) {
            setSubjects([]);
            setGrades([]);
            return;
        }

        try {
            const [subjectData, gradeData] = await Promise.all([
                getCenterSubjects(centerId),
                getCenterGrades(centerId),
            ]);
            setSubjects(subjectData);
            setGrades(gradeData);
        } catch (error) {
            console.error(error);
            toast.error("Unable to load subjects or grades.");
        }
    };

    useEffect(() => {
        if (initialData) {
            skipNextOnChangeRef.current = true;
            setFormData(prev => {
                const next = { ...prev, ...initialData };

                if (
                    prev.name === next.name &&
                    prev.subjectId === next.subjectId &&
                    prev.gradeId === next.gradeId &&
                    prev.description === next.description &&
                    prev.startDate === next.startDate &&
                    prev.endDate === next.endDate &&
                    prev.centerId === next.centerId
                ) {
                    return prev;
                }

                return next;
            });
        }
    }, [initialData]);

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
        }

        if (skipNextOnChangeRef.current) {
            skipNextOnChangeRef.current = false;
            return;
        }

        onChange?.(formData);
    }, [formData, onChange]);

    useEffect(() => {
        fetchCenterOptions(formData.centerId);
    }, [formData.centerId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (

        <>

            {formData.centerId && (
                <>
                    <SubjectModal
                        centerId={formData.centerId}
                        isOpen={isSubjectModalOpen}
                        onClose={() => setIsSubjectModalOpen(false)}
                        onSuccess={handleSubjectModalSuccess}
                        subject={editingSubject}
                    />

                    <GradeModal
                        centerId={formData.centerId}
                        isOpen={isGradeModalOpen}
                        onClose={() => setIsGradeModalOpen(false)}
                        onSuccess={handleGradeModalSuccess}
                        grade={editingGrade}
                    />
                </>
            )}
            <form
                onSubmit={handleSubmit}
                className="space-y-6 bg-[var(--color-soft-white)] p-8 rounded-xl shadow-sm"
            >



                {/* CENTER SELECT */}
                <div className="p-4 rounded-lg bg-white">
                    <label className="block text-sm font-bold text-[var(--color-text)] mb-2 flex items-center gap-2">
                        <Building2 size={16} className="text-[var(--color-main)]" />
                        Center <span className="text-[var(--color-negative)]">*</span>
                    </label>

                    <div className="relative">
                        <select
                            required
                            disabled={isCenterLocked}
                            value={formData.centerId || ""}
                            onChange={e => updateFormData({ ...formData, centerId: Number(e.target.value) })}
                            className={`w-full p-3 border-2 rounded-lg outline-none appearance-none transition
                            ${isCenterLocked
                                    ? "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
                                    : "bg-white border-[var(--color-main)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-secondary)]"
                                }`}
                        >
                            <option value="">-- Select a center --</option>
                            {centers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        {!isCenterLocked && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-main)]">
                                ▼
                            </div>
                        )}
                    </div>

                    <p className="text-xs mt-2 text-[var(--color-text)]/70">
                        {isCenterLocked
                            ? "* This course is fixed to the selected center."
                            : "* Please select a center for this course."
                        }
                    </p>
                </div>

                {/* COURSE NAME */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                        Course name <span className="text-[var(--color-negative)]">*</span>
                    </label>
                    <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={e => updateFormData({ ...formData, name: e.target.value })}
                        className="w-full p-3 border-2 border-[var(--color-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-secondary)] outline-none bg-white"
                        placeholder="Example: Fast-track Math 10 Preparation"
                    />
                </div>

                {/* SUBJECT + GRADE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <label className="block text-sm font-bold text-[var(--color-text)]">
                                Subject
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!formData.centerId) {
                                        toast.error("Please select a center first.");
                                        return;
                                    }

                                    setEditingSubject(null);
                                    setIsSubjectModalOpen(true);
                                }}
                                className="flex items-center gap-1 text-xs text-[var(--color-main)] hover:underline"
                            >
                                <Plus size={14} />
                                Add new
                            </button>
                        </div>

                        <div className="relative">
                            <select
                                value={formData.subjectId ?? ""}
                                onChange={e =>
                                    updateFormData({
                                        ...formData,
                                        subjectId: e.target.value ? Number(e.target.value) : undefined,
                                    })
                                }
                                className="w-full p-3 pr-10 border-2 border-[var(--color-main)] rounded-lg outline-none appearance-none transition
                       bg-white text-[var(--color-text)]
                       focus:ring-2 focus:ring-[var(--color-secondary)]"
                            >
                                <option value="">-- Select a subject --</option>
                                {subjects.map(subject => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </option>
                                ))}
                            </select>

                            {/* Custom Arrow */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-main)]">
                                ▼
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <label className="block text-sm font-medium text-[var(--color-text)]">
                                Grade
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!formData.centerId) {
                                        toast.error("Please select a center first.");
                                        return;
                                    }

                                    setEditingGrade(null);
                                    setIsGradeModalOpen(true);
                                }}
                                className="flex items-center gap-1 text-xs text-[var(--color-main)] hover:underline"
                            >
                                <Plus size={14} />
                                Add new
                            </button>
                        </div>

                        <div className="relative">
                            <select
                                value={formData.gradeId ?? ""}
                                onChange={e => updateFormData({
                                    ...formData,
                                    gradeId: e.target.value ? Number(e.target.value) : undefined,
                                })}
                                className="w-full p-3 border-2 border-[var(--color-main)] rounded-lg outline-none appearance-none transition bg-white text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-secondary)]"
                            >
                                <option value="">-- Select a grade --</option>
                                {grades.length === 0 && (
                                    <option value="" disabled>
                                        No grades yet (please add one)
                                    </option>
                                )}
                                {grades.map(grade => (
                                    <option key={grade.id} value={grade.id}>
                                        {grade.name}
                                        {grade.fromAge != null && grade.toAge != null
                                            ? ` (age ${grade.fromAge}-${grade.toAge})`
                                            : ""}
                                    </option>
                                ))}
                            </select>

                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-main)]">
                                ▼
                            </div>
                        </div>
                    </div>
                </div>

                {/* DATES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {["startDate", "endDate"].map((field, i) => (
                        <div key={field}>
                            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                {i === 0 ? <span>Start date <span className="text-[var(--color-negative)]">*</span></span> : <span>End date <span className="text-[var(--color-negative)]">*</span></span>}
                            </label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-main)]" />
                                <input
                                    required
                                    type="date"
                                    value={(formData as any)[field]}
                                    onChange={e => updateFormData({ ...formData, [field]: e.target.value })}
                                    className="w-full p-3 pl-10 border-2 border-[var(--color-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-secondary)] outline-none bg-white"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                {/* TUITION FEE */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                        Tuition Fee (VND)
                        <span className="text-[var(--color-negative)]">*</span>
                    </label>

                    <input
                        required
                        type="number"
                        min="0"
                        value={formData.tuitionFeeVnd ?? ""}
                        onChange={e =>
                            updateFormData({
                                ...formData,
                                tuitionFeeVnd: Number(e.target.value),
                            })
                        }
                        className="w-full p-3 border-2 border-[var(--color-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-secondary)] outline-none bg-white"
                        placeholder="3000000"
                    />
                </div>
                {/* DESCRIPTION */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                        Description
                    </label>
                    <textarea
                        rows={4}
                        value={formData.description}
                        onChange={e => updateFormData({ ...formData, description: e.target.value })}
                        className="w-full p-3 border-2 border-[var(--color-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-secondary)] outline-none bg-white"
                        placeholder="Course details, goals, and outcomes..."
                    />
                </div>

                {/* SUBMIT */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading || !hasAvailableCenterSelection}
                        className="w-full bg-[var(--color-main)] border-2 border-[var(--color-main)] text-white py-3 rounded-lg font-bold hover:bg-[var(--color-soft-white)] hover:text-[var(--color-main)] transition disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {loading ? "Processing..." : <><Save size={20} /> {btnLabel}</>}
                    </button>

                    {!hasAvailableCenterSelection && (
                        <p className="text-center text-[var(--color-negative)] text-sm mt-2">
                            You don't have any centers to create a course.
                        </p>
                    )}
                </div>
            </form>
        </>
    );
}