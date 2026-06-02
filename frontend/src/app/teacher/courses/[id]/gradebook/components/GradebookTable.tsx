"use client";

import { useMemo, useState } from "react";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
    ColumnDef,
    SortingState,
    ColumnFiltersState,
} from "@tanstack/react-table";

import {
    GradebookResponse,
    StudentGradebookRow,
} from "@/services/gradebookService";

import GradebookScoreCell from "./GradebookScoreCell";

interface Props {
    gradebook: GradebookResponse;
    editMode: boolean;
    pendingChanges: Record<string, number>;
    onScoreChange: (studentId: number, scoreItemId: number, score: number) => void;
    onCategoryHeaderChange: (id: number, field: "name" | "weight", value: string | number) => void;
    onScoreItemHeaderChange: (
        id: number,
        field: "name" | "categoryId",
        value: string | number
    ) => void;
    categoryEdits: Record<number, { name: string; weight: number }>;
    scoreItemEdits: Record<number, { name: string; categoryId: number }>;
}

const columnHelper = createColumnHelper<StudentGradebookRow>();

const CLS_INPUT = "text-xs border border-zinc-200 rounded px-2 py-1 w-full font-normal text-zinc-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all";
const CLS_STICKY_LEFT = "sticky left-0 bg-white z-20 min-w-[240px] max-w-[240px] w-[240px] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-2 after:translate-x-full after:bg-gradient-to-r after:from-black/[0.05] after:to-transparent after:pointer-events-none";
const CLS_STICKY_RIGHT = "sticky right-0 bg-white z-20 min-w-[110px] max-w-[110px] w-[110px] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-2 before:-translate-x-full before:bg-gradient-to-l before:from-black/[0.05] before:to-transparent before:pointer-events-none";
const CLS_SCORE_COL = "min-w-[85px] max-w-[85px] w-[85px]";

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
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 20,
    });

    const orderedCategories = useMemo(() => {
        return [...gradebook.categories].sort(
            (a, b) => (a.weight ?? 0) - (b.weight ?? 0)
        );
    }, [gradebook.categories]);

    // ==========================================
    // COLUMNS LAYOUT GENERATION
    // ==========================================
    const columns = useMemo<ColumnDef<StudentGradebookRow, any>[]>(() => {
        const dynamicCategories: ColumnDef<StudentGradebookRow>[] =
            orderedCategories.map((cat, catIdx) => {
                const items = gradebook.scoreItems
                    .filter(i => i.scoreCategoryId === cat.id)
                    .sort((a, b) => a.name.localeCompare(b.name));
                return {
                    id: `cat-${cat.id}`,
                    enableSorting: false,

                    header: (info) => {
                        const tableMeta = info.table.options.meta as any;
                        const currentCategoryEdits = tableMeta?.categoryEdits || {};
                        const currentOnCategoryHeaderChange = tableMeta?.onCategoryHeaderChange;

                        return (
                            <div className="flex flex-col items-center text-center w-full px-2 py-1" onClick={(e) => e.stopPropagation()}>
                                {editMode ? (
                                    <div className="space-y-1 w-full max-w-[160px]">
                                        <input
                                            className={CLS_INPUT}
                                            value={currentCategoryEdits[cat.id]?.name ?? cat.name}
                                            onChange={(e) =>
                                                currentOnCategoryHeaderChange?.(cat.id, "name", e.target.value)
                                            }
                                        />
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                step={5}
                                                className={`${CLS_INPUT} pr-5 text-center`}
                                                value={currentCategoryEdits[cat.id]?.weight ?? cat.weight}
                                                onChange={(e) => {
                                                    const nextWeight = e.target.value === "" ? 0 : Number(e.target.value);
                                                    currentOnCategoryHeaderChange?.(cat.id, "weight", nextWeight);
                                                }}
                                            />
                                            <span className="absolute right-2 text-[10px] text-zinc-400 font-medium pointer-events-none">%</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-bold text-slate-800 tracking-wider text-[13px] uppercase block truncate max-w-[150px]">
                                            {cat.name}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 mt-1.5 text-[11px] font-bold rounded-md bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm">
                                            {cat.weight}%
                                        </span>
                                    </>
                                )}
                            </div>
                        );
                    },

                    columns:
                        items.length > 0
                            ? items.map((item, itemIdx) =>
                                columnHelper.accessor(
                                    (row) => row.scores[item.id],
                                    {
                                        id: `item-${item.id}`,
                                        enableSorting: false,

                                        header: (info) => {
                                            const tableMeta = info.table.options.meta as any;
                                            const currentScoreItemEdits = tableMeta?.scoreItemEdits || {};
                                            const currentOnScoreItemHeaderChange = tableMeta?.onScoreItemHeaderChange;

                                            return (
                                                <div className="text-xs text-center w-full px-1 py-1 flex flex-col items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    {editMode ? (
                                                        <>
                                                            <input
                                                                className={`${CLS_INPUT} text-center`}
                                                                value={currentScoreItemEdits[item.id] ?? item.name}
                                                                onChange={(e) =>
                                                                    currentOnScoreItemHeaderChange?.(item.id, e.target.value)
                                                                }
                                                            />
                                                        </>
                                                    ) : (
                                                        <span className="text-teal-700 font-semibold text-[11px] uppercase tracking-wide block truncate max-w-[85px]" title={item.name}>
                                                            {item.name}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        },

                                        cell: (info) => {
                                            const student = info.row.original;
                                            const tableMeta = info.table.options.meta as any;
                                            const currentPendingChanges = tableMeta?.pendingChanges || {};
                                            const currentOnScoreChange = tableMeta?.onScoreChange;

                                            const key = `${student.studentId}-${item.id}`;
                                            const liveScore = currentPendingChanges[key] ?? student.scores[item.id];

                                            return (
                                                <div className="flex justify-center items-center w-full h-full">
                                                    <GradebookScoreCell
                                                        studentId={student.studentId}
                                                        scoreItemId={item.id}
                                                        score={liveScore}
                                                        editable={editMode}
                                                        onChange={currentOnScoreChange}
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
                                        enableSorting: false,
                                        header: () => (
                                            <div className="text-xs text-slate-400 italic font-normal py-1">
                                                No items
                                            </div>
                                        ),
                                        cell: () => <span className="text-zinc-300 font-light">-</span>,
                                    }
                                ),
                            ],
                };
            });

        return [
            columnHelper.accessor((row) => `${row.lastName} ${row.firstName}`, {
                id: "student",
                header: "Student Name",
                cell: (info) => {
                    const s = info.row.original;
                    return (
                        <div className="font-medium text-slate-900 truncate pr-2 text-left" title={`${s.lastName} ${s.firstName}`}>
                            {s.lastName}, <span className="text-slate-500 font-normal">{s.firstName}</span>
                        </div>
                    );
                },
            }),
            ...dynamicCategories,
            columnHelper.accessor("finalScore", {
                id: "finalScore",
                header: "Final Grade",
                cell: (info) => {
                    const val = info.getValue();
                    return (
                        <div className="font-bold text-indigo-600 text-center tracking-tight text-sm">
                            {val != null ? val.toFixed(2) : <span className="text-zinc-300 font-normal">—</span>}
                        </div>
                    );
                },
                filterFn: "inNumberRange",
            }),
        ];
    }, [orderedCategories, gradebook.scoreItems, editMode]);

    // ==========================================
    // TABLE INSTANCE ASSEMBLY
    // ==========================================
    const table = useReactTable({
        data: gradebook.students,
        columns,
        state: {
            sorting,
            columnFilters,
            pagination,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        meta: {
            categoryEdits,
            scoreItemEdits,
            pendingChanges,
            onCategoryHeaderChange,
            onScoreItemHeaderChange,
            onScoreChange,
        },
    });

    const currentFilterVal = (columnFilters.find((f) => f.id === "finalScore")?.value as [number | undefined, number | undefined]) || [undefined, undefined];
    const uiMin = currentFilterVal[0] ?? "";
    const uiMax = currentFilterVal[1] ?? "";

    const execFilterDispatch = (minStr: string, maxStr: string) => {
        const parsedMin = minStr === "" ? undefined : Number(minStr);
        const parsedMax = maxStr === "" ? undefined : Number(maxStr);
        setColumnFilters((prev) => {
            const external = prev.filter((f) => f.id !== "finalScore");
            return [...external, { id: "finalScore", value: [parsedMin, parsedMax] }];
        });
    };

    return (
        <div className="h-full flex flex-col gap-4 antialiased selection:bg-indigo-100">
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-4 p-3.5 bg-white border border-zinc-200 rounded-xl shadow-sm text-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z" />
                        </svg>
                    </div>
                    <div>
                        <span className="font-semibold text-zinc-700 block text-xs uppercase tracking-wider">Final Score Filter</span>
                        <span className="text-zinc-400 text-[11px]">Isolate student achievement cohorts</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        placeholder="Min %"
                        className="border border-zinc-200 rounded-lg px-3 py-1.5 w-24 text-center text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-sm"
                        value={uiMin}
                        onChange={(e) => execFilterDispatch(e.target.value, String(uiMax))}
                    />
                    <span className="text-zinc-300 font-medium">—</span>
                    <input
                        type="number"
                        placeholder="Max %"
                        className="border border-zinc-200 rounded-lg px-3 py-1.5 w-24 text-center text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-sm"
                        value={uiMax}
                        onChange={(e) => execFilterDispatch(String(uiMin), e.target.value)}
                    />
                    {(uiMin !== "" || uiMax !== "") && (
                        <button
                            onClick={() => execFilterDispatch("", "")}
                            className="ml-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto border border-zinc-200 rounded-xl bg-white shadow-sm ring-1 ring-black/[0.02]">
                <table className="w-max min-w-full border-separate border-spacing-0 table-fixed bg-white">
                    <thead className="bg-zinc-50/75 backdrop-blur-sm sticky top-0 z-30">
                        {table.getHeaderGroups().map((hg) => (
                            <tr key={hg.id} className="border-zinc-200">
                                {hg.headers.map((header) => {
                                    const isStudent = header.column.id === "student";
                                    const isFinal = header.column.id === "finalScore";
                                    const isCategory = header.column.id.startsWith("cat-");
                                    const isItem = header.column.id.startsWith("item-") || header.column.id.startsWith("empty-");
                                    const canSort = header.column.getCanSort();
                                    const sortStatus = header.column.getIsSorted();

                                    let structuralWidthClass = CLS_SCORE_COL;
                                    if (isStudent) structuralWidthClass = CLS_STICKY_LEFT;
                                    if (isFinal) structuralWidthClass = CLS_STICKY_RIGHT;

                                    return (
                                        <th
                                            key={header.id}
                                            colSpan={header.colSpan > 1 ? header.colSpan : undefined}
                                            rowSpan={header.rowSpan > 1 ? header.rowSpan : undefined}
                                            className={`
                                                px-3 py-2.5 font-semibold text-xs border-b border-r transition-colors
                                                ${structuralWidthClass}
                                                ${isStudent ? "!bg-slate-100 text-slate-800 border-slate-300" : ""}
                                                ${isFinal ? "!bg-indigo-50 text-indigo-900 border-indigo-200" : ""}
                                                ${isCategory && !isStudent && !isFinal ? "bg-slate-100 border-slate-300 shadow-sm" : ""}
                                                ${isItem && !isStudent && !isFinal ? "bg-white border-slate-200 text-slate-600" : ""}
                                                ${!isStudent && !isFinal && !isCategory && !isItem ? "border-zinc-200/80 bg-zinc-50/90" : ""}
                                            `}
                                        >
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={`flex items-center gap-1.5 w-full h-full ${canSort ? "cursor-pointer select-none hover:text-indigo-600" : ""} ${isStudent ? "justify-start" : "justify-center"}`}
                                                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                                                >
                                                    <div className="truncate">
                                                        {flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                    </div>
                                                    {canSort && (
                                                        <span className="text-zinc-400 shrink-0 font-normal transition-transform duration-150">
                                                            {sortStatus === "asc" ? "▲" : sortStatus === "desc" ? "▼" : "⇅"}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>

                    <tbody className="divide-y divide-zinc-100">
                        {table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                className="odd:bg-white even:bg-zinc-50/40 hover:bg-indigo-50/30 transition-colors duration-100 ease-in"
                            >
                                {row.getVisibleCells().map((cell) => {
                                    const isStudent = cell.column.id === "student";
                                    const isFinal = cell.column.id === "finalScore";

                                    let cellWidthClass = CLS_SCORE_COL;
                                    if (isStudent) cellWidthClass = CLS_STICKY_LEFT;
                                    if (isFinal) cellWidthClass = CLS_STICKY_RIGHT;

                                    return (
                                        <td
                                            key={cell.id}
                                            className={`
                                                px-3 py-1.5 text-sm border-r border-zinc-100 whitespace-nowrap align-middle
                                                ${cellWidthClass}
                                                ${isStudent ? "font-medium group-hover:bg-indigo-50/10" : ""}
                                                ${isFinal ? "bg-inherit" : ""}
                                            `}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border border-zinc-200 rounded-xl shadow-sm text-xs">
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-medium">Rows per page:</span>
                        <select
                            value={table.getState().pagination.pageSize}
                            className="bg-white border border-zinc-200 rounded-lg px-2 py-1 font-medium text-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm text-xs"
                            onChange={(e) => table.setPageSize(Number(e.target.value))}
                        >
                            {[10, 20, 50, 100].map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="text-zinc-500 font-medium border-l border-zinc-200 pl-4 py-0.5">
                        Showing <span className="text-zinc-800 font-semibold">{table.getRowModel().rows.length}</span> of{" "}
                        <span className="text-zinc-800 font-semibold">{table.getFilteredRowModel().rows.length}</span> Students
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="text-zinc-500 font-medium">
                        Page <strong className="text-zinc-800 font-semibold">{table.getState().pagination.pageIndex + 1}</strong> of{" "}
                        <strong className="text-zinc-800 font-semibold">{table.getPageCount() || 1}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-zinc-400 font-semibold shadow-sm transition-all select-none"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </button>
                        <button
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-zinc-400 font-semibold shadow-sm transition-all select-none"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}