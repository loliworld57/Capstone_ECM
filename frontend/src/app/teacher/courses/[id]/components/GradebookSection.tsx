"use client";

import { useEffect, useMemo, useState } from "react";
import { GradebookResponse, gradebookService } from "@/services/gradebookService";
import GradebookTable from "../gradebook/components/GradebookTable";
import GradebookToolbar from "../gradebook/components/GradebookToolbar";
import WeightWarningBanner from "../gradebook/components/WeightWarningBanner";
import CategoryModal from "../gradebook/components/CategoryModal";
import ScoreItemModal from "../gradebook/components/ScoreItemModal";
import { Trash2 } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

interface Props {
    courseId: number;
}

type GradebookView = "Score Sheet" | "Categories" | "Score Items";

type CategoryEditState = Record<number, { name: string; weight: number }>;
type ScoreItemEditState = Record<number, { name: string; categoryId: number }>;

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

    const [deletingCategory, setDeletingCategory] = useState<{
        id: number;
        name: string;
    } | null>(null);

    const [deletingScoreItem, setDeletingScoreItem] = useState<{
        id: number;
        name: string;
    } | null>(null);


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
            sEdits[s.id] = {
                name: s.name,
                categoryId: s.scoreCategoryId,
            };
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

    const handleScoreItemHeaderChange = (
        scoreItemId: number,
        field: "name" | "categoryId",
        value: string | number
    ) => {
        setScoreItemEdits((prev) => ({
            ...prev,
            [scoreItemId]: {
                ...prev[scoreItemId],
                [field]: value,
            },
        }));
    };

    const hasChanges =
        Object.keys(pendingChanges).length > 0 ||
        (() => {
            if (!gradebook) return false;

            for (const c of gradebook.categories) {
                const ed = categoryEdits[c.id];
                if (ed && (ed.name !== c.name || ed.weight !== c.weight)) {
                    return true;
                }
            }

            for (const s of gradebook.scoreItems) {
                const ed = scoreItemEdits[s.id];

                if (
                    ed &&
                    (ed.name !== s.name || ed.categoryId !== s.scoreCategoryId)
                ) {
                    return true;
                }
            }

            return false;
        })();

    const resetEdits = () => {
        if (!gradebook) return;

        const cEdits: CategoryEditState = {};
        gradebook.categories.forEach((c) => {
            cEdits[c.id] = {
                name: c.name,
                weight: c.weight,
            };
        });

        const sEdits: ScoreItemEditState = {};
        gradebook.scoreItems.forEach((s) => {
            sEdits[s.id] = {
                name: s.name,
                categoryId: s.scoreCategoryId,
            };
        });

        setCategoryEdits(cEdits);
        setScoreItemEdits(sEdits);
        setPendingChanges({});
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
                const ed = scoreItemEdits[s.id];
                if (ed && (ed.name !== s.name || ed.categoryId !== s.scoreCategoryId)) {
                    ops.push(
                        gradebookService.updateScoreItem(courseId, s.id, {
                            name: ed.name,
                            scoreCategoryId: ed.categoryId
                        })
                    );
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

    const handleEditModeToggle = async () => {
        if (!editMode) {
            setEditMode(true);
            return;
        }

        if (!hasChanges) {
            setEditMode(false);
            return;
        }

        await handleSaveChanges();
    };

    const handleDiscardChanges = () => {
        resetEdits();
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
        try {
            await gradebookService.deleteCategory(courseId, categoryId);
            const updated = await gradebookService.getGradebook(courseId);
            setGradebook(updated);
            setDeletingCategory(null);
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
        try {
            await gradebookService.deleteScoreItem(courseId, scoreItemId);
            const updated = await gradebookService.getGradebook(courseId);
            setGradebook(updated);
            setDeletingScoreItem(null);
        } catch (err: any) {
            setError(err.message || "Failed to delete score item");
        }
    };

    if (loading) return <div className="p-8 text-center">Loading gradebook...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!gradebook) return <div className="p-8 text-center">No gradebook data available</div>;

    return (
        <div className="h-auto flex flex-col bg-[var(--color-soft-white)] rounded-xl border border-[var(--color-main)] shadow-sm overflow-visible md:overflow-hidden">
            <div className="shrink-0 bg-[var(--color-main)] text-white px-6 py-4 flex items-center justify-between font-semibold">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">Gradebook</span>
                </div>
                <div className="text-sm text-white/90">{gradebook.courseName}</div>
            </div>

            <div className="p-4 sm:p-6 flex flex-col md:flex-1 md:min-h-0">
                {!gradebook.weightComplete && (
                    <div className="shrink-0 mb-4">
                        <WeightWarningBanner totalWeight={gradebook.totalWeight} />
                    </div>
                )}

                <div className="shrink-0 mb-4 flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 shadow-sm rounded-t-lg">
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

                <div className="shrink-0">
                    <GradebookToolbar
                        editMode={editMode}
                        hasChanges={hasChanges}
                        onEditModeToggle={handleEditModeToggle}
                        onDiscard={handleDiscardChanges}
                        onAddCategory={() => setShowCategoryModal(true)}
                        onAddScoreItem={() => setShowScoreItemModal(true)}
                        onExport={() => console.log("Export gradebook to Excel")}
                    />
                </div>

                <div className="mt-6 md:flex-1 md:min-h-0 flex flex-col w-full overflow-x-auto">
                    {activeView === "Score Sheet" && (
                        <div className="md:flex-1 md:min-h-0 w-full overflow-x-auto">
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
                        </div>
                    )}

                    {activeView === "Categories" && (
                        <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                            <table className="min-w-[640px] w-full border-collapse">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Category</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Weight</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Score Items</th>
                                        {editMode && (
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                                                Actions
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {categoriesWithItems.map((category) => (
                                        <tr key={category.id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {editMode ? (
                                                    <input
                                                        type="text"
                                                        value={categoryEdits[category.id]?.name ?? category.name}
                                                        onChange={(e) => handleCategoryHeaderChange(category.id, "name", e.target.value)}
                                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[var(--color-main)] focus:outline-none"
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
                                            {editMode && (
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setDeletingCategory({
                                                                id: category.id,
                                                                name: category.name,
                                                            })
                                                        }
                                                        className="rounded-lg border-2 border-[var(--color-alert)] bg-[var(--color-alert)] p-2 text-white transition hover:bg-white hover:text-[var(--color-alert)]"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeView === "Score Items" && (
                        <div className="flex-1 min-h-[300px] overflow-auto border border-zinc-200 rounded-xl bg-white shadow-sm ring-1 ring-black/[0.02]">                            <table className="min-w-[760px] w-full border-collapse">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Category</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Score Item</th>
                                    {editMode && (
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {categoriesWithItems.flatMap((category) =>
                                    category.items.map((scoreItem) => (
                                        <tr key={scoreItem.id} className="border-b border-gray-200 hover:bg-gray-50">
                                            {/* CATEGORY COLUMN */}
                                            <td className="px-4 py-3">
                                                {editMode ? (
                                                    <select
                                                        value={scoreItemEdits[scoreItem.id]?.categoryId ?? scoreItem.scoreCategoryId}
                                                        onChange={(e) => handleScoreItemHeaderChange(scoreItem.id, "categoryId", Number(e.target.value))}
                                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[var(--color-main)] focus:outline-none"
                                                    >
                                                        {gradebook.categories.map((cat) => (
                                                            <option key={cat.id} value={cat.id}>
                                                                {cat.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    category.name
                                                )}
                                            </td>

                                            {/* SCORE ITEM NAME COLUMN */}
                                            <td className="px-4 py-3">
                                                {editMode ? (
                                                    <input
                                                        type="text"
                                                        value={scoreItemEdits[scoreItem.id]?.name ?? scoreItem.name}
                                                        onChange={(e) => handleScoreItemHeaderChange(scoreItem.id, "name", e.target.value)}
                                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[var(--color-main)] focus:outline-none"
                                                    />
                                                ) : (
                                                    scoreItem.name
                                                )}
                                            </td>

                                            {/* ACTIONS COLUMN */}
                                            {editMode && (
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setDeletingScoreItem({
                                                                id: scoreItem.id,
                                                                name: scoreItem.name,
                                                            })
                                                        }
                                                        className="rounded-lg border-2 border-[var(--color-alert)] bg-[var(--color-alert)] p-2 text-white transition hover:bg-white hover:text-[var(--color-alert)]"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            )}
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

            <ConfirmModal
                isOpen={!!deletingCategory}
                title="Delete Category"
                message={`Delete category "${deletingCategory?.name || ""}"?`}
                confirmText="Delete"
                onClose={() => setDeletingCategory(null)}
                onConfirm={() =>
                    deletingCategory
                        ? handleDeleteCategory(deletingCategory.id)
                        : undefined
                }
            />

            <ConfirmModal
                isOpen={!!deletingScoreItem}
                title="Delete Score Item"
                message={`Delete score item "${deletingScoreItem?.name || ""}"?`}
                confirmText="Delete"
                onClose={() => setDeletingScoreItem(null)}
                onConfirm={() =>
                    deletingScoreItem
                        ? handleDeleteScoreItem(deletingScoreItem.id)
                        : undefined
                }
            />
        </div>
    );
}