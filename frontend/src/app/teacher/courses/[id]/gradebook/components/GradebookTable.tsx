"use client";

import { useEffect, useMemo, useState } from "react";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    ColumnDef,
} from "@tanstack/react-table";

import {
    GradebookResponse,
    ScoreCategory,
    ScoreItem,
    StudentGradebookRow,
} from "@/services/gradebookService";

import GradebookScoreCell from "./GradebookScoreCell";

interface Props {
    gradebook: GradebookResponse;
    editMode: boolean;
    pendingChanges: Record<string, number>;
    onScoreChange: (studentId: number, scoreItemId: number, score: number) => void;
    onCategoryHeaderChange: (id: number, field: "name" | "weight", value: any) => void;
    onScoreItemHeaderChange: (id: number, name: string) => void;
    categoryEdits: Record<number, { name: string; weight: number }>;
    scoreItemEdits: Record<number, string>;
}

const columnHelper = createColumnHelper<StudentGradebookRow>();

export default function GradebookTable({
    gradebook,
    editMode,
    pendingChanges,
    onScoreChange,
    onCategoryHeaderChange,
    onScoreItemHeaderChange,
    categoryEdits,
    scoreItemEdits,
}: Props) {

    // =========================
    // helpers
    // =========================
    const getScore = (student: StudentGradebookRow, itemId: number) => {
        const key = `${student.studentId}-${itemId}`;
        return pendingChanges[key] ?? student.scores[itemId];
    };
    // =========================
    // COLUMNS (FULL DYNAMIC)
    // =========================
    const columns = useMemo<ColumnDef<StudentGradebookRow, any>[]>(() => {
        const dynamicCategories: ColumnDef<StudentGradebookRow>[] =
            gradebook.categories.map((cat) => {

                const items = gradebook.scoreItems.filter(
                    (i) => i.scoreCategoryId === cat.id
                );

                return {
                    id: `cat-${cat.id}`,

                    // ===== CATEGORY HEADER =====
                    header: () => (
                        <div className="flex flex-col items-center text-center">
                            {editMode ? (
                                <>
                                    <input
                                        className="text-xs border rounded px-1 py-0.5 w-24"
                                        value={categoryEdits[cat.id]?.name || ""}
                                        onChange={(e) =>
                                            onCategoryHeaderChange(cat.id, "name", e.target.value)
                                        }
                                    />
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={5}
                                        className="text-xs border rounded px-1 py-0.5 w-16 mt-1"
                                        value={categoryEdits[cat.id]?.weight ?? cat.weight}
                                        onChange={(e) => {
                                            const nextWeight = e.target.value === "" ? 0 : Number(e.target.value);
                                            onCategoryHeaderChange(cat.id, "weight", nextWeight);
                                        }}
                                    />
                                </>
                            ) : (
                                <>
                                    <div className="font-semibold text-xs uppercase">
                                        {cat.name}
                                    </div>
                                    <div className="text-[10px] text-gray-500">
                                        {cat.weight}%
                                    </div>
                                </>
                            )}
                        </div>
                    ),

                    // ===== CHILD COLUMNS =====
                    columns:
                        items.length > 0
                            ? items.map((item) =>
                                columnHelper.accessor(
                                    (row) => getScore(row, item.id),
                                    {
                                        id: `item-${item.id}`,

                                        header: () => (
                                            <div className="text-xs text-center">
                                                {editMode ? (
                                                    <input
                                                        className="border rounded px-1 py-0.5 w-20 text-center"
                                                        value={
                                                            scoreItemEdits[item.id] ?? item.name
                                                        }
                                                        onChange={(e) =>
                                                            onScoreItemHeaderChange(
                                                                item.id,
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                ) : (
                                                    item.name
                                                )}
                                            </div>
                                        ),

                                        cell: (info) => {
                                            const student = info.row.original;

                                            return (
                                                <div className="flex justify-center">
                                                    <GradebookScoreCell
                                                        studentId={student.studentId}
                                                        scoreItemId={item.id}
                                                        score={info.getValue()}
                                                        editable={editMode}
                                                        onChange={onScoreChange}
                                                    />
                                                </div>
                                            );
                                        },
                                    }
                                )
                            )
                            : [
                                columnHelper.accessor(
                                    () => null,
                                    {
                                        id: `empty-${cat.id}`,
                                        header: () => (
                                            <div className="text-xs text-gray-400 italic">
                                                No items
                                            </div>
                                        ),
                                        cell: () => <span className="text-gray-300">-</span>,
                                    }
                                ),
                            ],
                };
            });

        return [
            // =========================
            // STUDENT (FIXED LEFT)
            // =========================
            columnHelper.display({
                id: "student",
                header: "Student",
                cell: (info) => {
                    const s = info.row.original;
                    return (
                        <div className="font-semibold whitespace-nowrap">
                            {s.lastName} {s.firstName}
                        </div>
                    );
                },
                meta: { sticky: "left" },
            }),

            // =========================
            // DYNAMIC
            // =========================
            ...dynamicCategories,

            // =========================
            // FINAL SCORE (FIXED RIGHT)
            // =========================
            columnHelper.accessor("finalScore", {
                id: "finalScore",
                header: "Final Score",
                cell: (info) => (
                    <div className="font-bold text-indigo-600 text-center">
                        {info.getValue() != null
                            ? info.getValue()!.toFixed(2)
                            : "-"}
                    </div>
                ),
                meta: { sticky: "right" },
            }),
        ];
    }, [gradebook, editMode, categoryEdits, scoreItemEdits, pendingChanges]);

    // =========================
    // TABLE INSTANCE
    // =========================
    const table = useReactTable({
        data: gradebook.students,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    
    // =========================
    // RENDER
    // =========================
    return (
        <div className="overflow-x-auto border border-[var(--color-main)] rounded-lg bg-white">
            <table className="min-w-full border-separate border-spacing-0 bg-white">
                <thead className="bg-[var(--color-secondary)]/10">
                    {table.getHeaderGroups().map((hg) => (
                        <tr key={hg.id}>
                            {hg.headers.map((header) => (
                                <th
                                    key={header.id}
                                    colSpan={header.colSpan > 1 ? header.colSpan : undefined}
                                    rowSpan={header.rowSpan > 1 ? header.rowSpan : undefined}
                                    className={`
                    border px-2 py-2 text-xs font-semibold text-left
                    ${header.column.id === "student" ? "sticky left-0 bg-[var(--color-secondary)]/10 z-20" : ""}
                    ${header.column.id === "finalScore" ? "sticky right-0 bg-[var(--color-secondary)]/10 z-20" : ""}
                  `}
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>

                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                            {row.getVisibleCells().map((cell) => (
                                <td
                                    key={cell.id}
                                    className={`
                    border px-2 py-1 text-xs text-center
                    ${cell.column.id === "student" ? "sticky left-0 bg-white z-10" : ""}
                    ${cell.column.id === "finalScore" ? "sticky right-0 bg-white z-10" : ""}
                  `}
                                >
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>

            </table>
        </div>
    );
}