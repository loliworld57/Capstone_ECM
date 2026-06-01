"use client";

import { useEffect, useMemo, useState } from "react";
import { GradebookResponse, gradebookService } from "@/services/gradebookService";
import GradebookTable from "../gradebook/components/GradebookTable";
import GradebookToolbar from "../gradebook/components/GradebookToolbar";
import WeightWarningBanner from "../gradebook/components/WeightWarningBanner";
import CategoryModal from "../gradebook/components/CategoryModal";
import ScoreItemModal from "../gradebook/components/ScoreItemModal";

interface Props {
    courseId: number;
}

type GradebookView = "Score Sheet" | "Categories" | "Score Items";

type CategoryEditState = Record<number, { name: string; weight: number }>;
type ScoreItemEditState = Record<number, string>;

export default function GradebookSection({ courseId }: Props) {
    const [gradebook, setGradebook] = useState<GradebookResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editMode, setEditMode] = useState(false);
    const [pendingChanges, setPendingChanges] = useState<Record<string, number>>({});

    const [activeView, setActiveView] = useState<GradebookView>("Score Sheet");
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showScoreItemModal, setShowScoreItemModal] = useState(false);

    const [categoryEdits, setCategoryEdits] = useState<CategoryEditState>({});
    const [scoreItemEdits, setScoreItemEdits] = useState<ScoreItemEditState>({});

    useEffect(() => {
        let mounted = true;
        const fetchGradebook = async () => {
            try {
                setLoading(true);
                const data = await gradebookService.getGradebook(courseId);
                if (!mounted) return;
                setGradebook(data);
                setError(null);
            } catch (err: any) {
                setError(err.message || "Failed to load gradebook");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchGradebook();
        return () => {
            mounted = false;
        };
    }, [courseId]);

    useEffect(() => {
        if (!gradebook) return;

        const cEdits: CategoryEditState = {};
        gradebook.categories.forEach(c => {
            cEdits[c.id] = { name: c.name, weight: c.weight };
        });

        setCategoryEdits(cEdits);

        const sEdits: ScoreItemEditState = {};
        gradebook.scoreItems.forEach(s => {
            sEdits[s.id] = s.name;
        });

        setScoreItemEdits(sEdits);
    }, [gradebook]);

    const categoriesWithItems = useMemo(() =>
        gradebook?.categories.map((category) => ({
            ...category,
            items: gradebook.scoreItems.filter((i) => i.scoreCategoryId === category.id),
        })) || [],
        [gradebook]
    );

    const makeChangeKey = (studentId: number, scoreItemId: number) => `${studentId}-${scoreItemId}`;

    const handleScoreChange = (studentId: number, scoreItemId: number, score: number) => {
        const key = makeChangeKey(studentId, scoreItemId);
        setPendingChanges((p) => ({ ...p, [key]: score }));
    };

    const handleCategoryHeaderChange = (categoryId: number, field: "name" | "weight", value: string | number) => {
        setCategoryEdits((prev) => ({ ...prev, [categoryId]: { ...prev[categoryId], [field]: value } }));
    };

    const handleScoreItemHeaderChange = (scoreItemId: number, name: string) => {
        setScoreItemEdits((prev) => ({ ...prev, [scoreItemId]: name }));
    };

    const resetEdits = () => {
        if (!gradebook) return;
        const cEdits: CategoryEditState = {};
        gradebook.categories.forEach((c) => (cEdits[c.id] = { name: c.name, weight: c.weight }));
        setCategoryEdits(cEdits);

        const sEdits: ScoreItemEditState = {};
        gradebook.scoreItems.forEach((s) => (sEdits[s.id] = s.name));
        setScoreItemEdits(sEdits);
    };

    const handleSaveChanges = async () => {
        if (!gradebook) return;
        try {
            setLoading(true);
            const ops: Promise<unknown>[] = [];

            // categories
            gradebook.categories.forEach((c) => {
                const ed = categoryEdits[c.id];
                if (ed && (ed.name !== c.name || ed.weight !== c.weight)) {
                    ops.push(gradebookService.updateCategory(courseId, c.id, { name: ed.name, weight: ed.weight }));
                }
            });

            // score items
            gradebook.scoreItems.forEach((s) => {
                const name = scoreItemEdits[s.id];
                if (name !== undefined && name !== s.name) {
                    ops.push(gradebookService.updateScoreItem(courseId, s.id, { name }));
                }
            });

            // student scores
            if (Object.keys(pendingChanges).length > 0) {
                const updates = Object.entries(pendingChanges).map(([key, score]) => {
                    const [studentId, scoreItemId] = key.split("-").map(Number);
                    return { studentId, scoreItemId, score };
                });
                ops.push(gradebookService.bulkUpdateStudentScores(courseId, updates));
            }

            await Promise.all(ops);
            const data = await gradebookService.getGradebook(courseId);
            setGradebook(data);
            setPendingChanges({});
            setEditMode(false);
        } catch (err: any) {
            setError(err.message || "Failed to save changes");
        } finally {
            setLoading(false);
        }
    };

    const handleDiscardChanges = () => {
        resetEdits();
        setPendingChanges({});
        setEditMode(false);
    };

    const handleCreateCategory = async (data: { name: string; weight: number }) => {
        try {
            await gradebookService.createCategory(courseId, data);
            const updated = await gradebookService.getGradebook(courseId);
            setGradebook(updated);
            setShowCategoryModal(false);
        } catch (err: any) {
            setError(err.message || "Failed to create category");
        }
    };

    const handleDeleteCategory = async (categoryId: number) => {
        if (!confirm("Are you sure you want to delete this category?")) return;
        try {
            await gradebookService.deleteCategory(courseId, categoryId);
            const updated = await gradebookService.getGradebook(courseId);
            setGradebook(updated);
        } catch (err: any) {
            setError(err.message || "Failed to delete category");
        }
    };

    const handleCreateScoreItem = async (categoryId: number, data: { name: string }) => {
        try {
            await gradebookService.createScoreItem(courseId, categoryId, data);
            const updated = await gradebookService.getGradebook(courseId);
            setGradebook(updated);
            setShowScoreItemModal(false);
        } catch (err: any) {
            setError(err.message || "Failed to create score item");
        }
    };

    const handleDeleteScoreItem = async (scoreItemId: number) => {
        if (!confirm("Are you sure you want to delete this score item?")) return;
        try {
            await gradebookService.deleteScoreItem(courseId, scoreItemId);
            const updated = await gradebookService.getGradebook(courseId);
            setGradebook(updated);
        } catch (err: any) {
            setError(err.message || "Failed to delete score item");
        }
    };

    if (loading) return <div className="p-8 text-center">Loading gradebook...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!gradebook) return <div className="p-8 text-center">No gradebook data available</div>;

    return (
        <div className="bg-[var(--color-soft-white)] rounded-xl border border-[var(--color-main)] shadow-sm mt-6 overflow-hidden">
            <div className="bg-[var(--color-main)] text-white px-6 py-4 flex items-center justify-between font-semibold">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">Gradebook</span>
                </div>
                <div className="text-sm text-white/90">{gradebook.courseName}</div>
            </div>
            <div className="p-6">
                {!gradebook.weightComplete && <WeightWarningBanner totalWeight={gradebook.totalWeight} />}

                <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 shadow-sm rounded-t-lg">
                    {(["Score Sheet", "Categories", "Score Items"] as GradebookView[]).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveView(tab)}
                            className={`px-4 py-2 text-sm font-medium transition ${activeView === tab
                                    ? "border-b-4 border-[var(--color-main)] text-[var(--color-main)]"
                                    : "border-b-4 border-transparent text-[var(--color-text)] hover:text-[var(--color-secondary)]"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <GradebookToolbar
                    editMode={editMode}
                    hasChanges={Object.keys(pendingChanges).length > 0 || (() => {
                        if (!gradebook) return false;
                        for (const c of gradebook.categories) {
                            const ed = categoryEdits[c.id];
                            if (ed && (ed.name !== c.name || ed.weight !== c.weight)) return true;
                        }
                        for (const s of gradebook.scoreItems) {
                            const name = scoreItemEdits[s.id];
                            if (name !== undefined && name !== s.name) return true;
                        }
                        return false;
                    })()}
                    onEditModeToggle={() => setEditMode((v) => !v)}
                    onSave={handleSaveChanges}
                    onDiscard={handleDiscardChanges}
                    onAddCategory={() => setShowCategoryModal(true)}
                    onAddScoreItem={() => setShowScoreItemModal(true)}
                    onExport={() => console.log("Export gradebook to Excel")}
                />

                <div className="space-y-6">
                    {activeView === "Score Sheet" && (
                        <GradebookTable
                            gradebook={gradebook}
                            editMode={editMode}
                            pendingChanges={pendingChanges}
                            onScoreChange={handleScoreChange}
                            categoryEdits={categoryEdits}
                            scoreItemEdits={scoreItemEdits}
                            onCategoryHeaderChange={handleCategoryHeaderChange}
                            onScoreItemHeaderChange={handleScoreItemHeaderChange}
                        />
                    )}

                    {activeView === "Categories" && (
                        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                            <table className="min-w-[640px] w-full border-collapse">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Category</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Weight</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Score Items</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categoriesWithItems.map((category) => (
                                        <tr key={category.id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                {editMode ? (
                                                    <input
                                                        type="text"
                                                        value={categoryEdits[category.id]?.name ?? category.name}
                                                        onChange={(e) => handleCategoryHeaderChange(category.id, "name", e.target.value)}
                                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                                                    />
                                                ) : (
                                                    category.name
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {editMode ? (
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        value={categoryEdits[category.id]?.weight ?? category.weight}
                                                        onChange={(e) => handleCategoryHeaderChange(category.id, "weight", Number(e.target.value))}
                                                        className="w-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                                                    />
                                                ) : (
                                                    `${category.weight}%`
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{category.items.length}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteCategory(category.id)}
                                                    className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 transition hover:bg-red-50"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeView === "Score Items" && (
                        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                            <table className="min-w-[760px] w-full border-collapse">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Category</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Score Item</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categoriesWithItems.flatMap((category) =>
                                        category.items.map((scoreItem) => (
                                            <tr key={scoreItem.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-700">{category.name}</td>
                                                <td className="px-4 py-3">
                                                    {editMode ? (
                                                        <input
                                                            type="text"
                                                            value={scoreItemEdits[scoreItem.id] ?? scoreItem.name}
                                                            onChange={(e) => handleScoreItemHeaderChange(scoreItem.id, e.target.value)}
                                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                                                        />
                                                    ) : (
                                                        scoreItem.name
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteScoreItem(scoreItem.id)}
                                                        className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 transition hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {showCategoryModal && (
                    <CategoryModal onClose={() => setShowCategoryModal(false)} onCreate={handleCreateCategory} mode="create" />
                )}

                {showScoreItemModal && (
                    <ScoreItemModal categories={gradebook.categories} onClose={() => setShowScoreItemModal(false)} onCreate={handleCreateScoreItem} mode="create" />
                )}
            </div>
        </div>
    );
}
