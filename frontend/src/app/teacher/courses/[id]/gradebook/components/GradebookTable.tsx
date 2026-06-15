"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import SimpleBar from "simplebar-react";

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
const CLS_STICKY_LEFT = "";
const CLS_STICKY_RIGHT = "";
const CLS_SCORE_COL = "min-w-[85px] w-[85px]";

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
                                        <span className="font-bold text-[var(--color-white)] text-s tracking-wider uppercase block truncate max-w-[150px]">
                                            {cat.name}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-md bg-[var(--color-white)] text-[var(--color-positive)] border border-indigo-200 shadow-sm">
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
                                                                value={currentScoreItemEdits[item.id]?.name ?? item.name}
                                                                onChange={(e) =>
                                                                    currentOnScoreItemHeaderChange?.(item.id, "name", e.target.value)
                                                                }
                                                            />
                                                        </>
                                                    ) : (
                                                        <span className="text-[var(--color-text)] font-semibold text-[11px] uppercase tracking-wide block truncate max-w-[85px]" title={item.name}>
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
                // Uses custom case-insensitive inclusion matching against combined student names
                filterFn: "includesString", 
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

    // Extract the active query value tied to the 'student' column configuration
    const searchVal = (columnFilters.find((f) => f.id === "student")?.value as string) || "";

    const handleSearchChange = (value: string) => {
        setColumnFilters((prev) => {
            const external = prev.filter((f) => f.id !== "student");
            if (!value) return external;
            return [...external, { id: "student", value }];
        });
    };

    const simpleBarRef = useRef<any>(null);

    useEffect(() => {
        const scrollElement = simpleBarRef.current?.getScrollElement();
        if (!scrollElement) return;

        const handleWheel = (e: WheelEvent) => {
            const canScrollLeft = scrollElement.scrollLeft > 0;
            const canScrollRight = scrollElement.scrollLeft < (scrollElement.scrollWidth - scrollElement.clientWidth);

            if ((e.deltaY > 0 && canScrollRight) || (e.deltaY < 0 && canScrollLeft)) {
                e.preventDefault();
                scrollElement.scrollLeft += e.deltaY;
            }
        };

        scrollElement.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            scrollElement.removeEventListener("wheel", handleWheel);
        };
    }, []);

    const displayRows = table.getRowModel().rows;
    const emptyRowsCount = Math.max(0, 10 - displayRows.length);

    return (
        <div className="h-full flex flex-col gap-4 min-h-0 w-full overflow-hidden">
            {/* Search Section */}
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-4 p-3.5 bg-white border border-zinc-200 rounded-xl shadow-sm text-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                        <Search className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div>
                        <span className="font-semibold text-zinc-700 block text-xs uppercase tracking-wider">Student Search</span>
                        <span className="text-zinc-400 text-[11px]">Locate records instantly by typing a name</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-72 relative">
                    <input
                        type="text"
                        placeholder="Search student name..."
                        className="border border-zinc-200 rounded-lg pl-3 pr-8 py-1.5 w-full text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-sm"
                        value={searchVal}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                    {searchVal && (
                        <button
                            onClick={() => handleSearchChange("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 hover:text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Table Viewport */}
            <div className="flex-1 min-h-0 border border-zinc-200 rounded-xl bg-white shadow-sm ring-1 ring-black/[0.02] overflow-hidden flex flex-col">
                <SimpleBar
                    className="tabs-scroll w-full h-full"
                    ref={simpleBarRef}
                    autoHide={false}
                    forceVisible="x"
                >
                    <table className="w-max min-w-full border-separate border-spacing-0 bg-white">
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
                                                px-2 py-1
                                                ${structuralWidthClass}
                                                ${isStudent ? "!bg-[var(--color-main)] !text-[var(--color-white)] border-r-2 border-l-2 border-white z-40" : ""}
                                                ${isFinal ? "!bg-[var(--color-main)] !text-[var(--color-white)] border-r-2 border-l-2 border-white z-40" : ""}
                                                ${isCategory && !isStudent && !isFinal ? "bg-[var(--color-main)] border-slate-300 shadow-sm border-r-2 border-l-2 border-white text-white" : ""}
                                                ${isItem && !isStudent && !isFinal ? "bg-[var(--color-secondary)]/10 border-slate-200 text-[var(--color-text)]" : ""}
                                                ${!isStudent && !isFinal && !isCategory && !isItem ? "border-zinc-200/80 bg-zinc-50/90" : ""}
                                            `}
                                            >
                                                {header.isPlaceholder ? null : (
                                                    <div
                                                        className={`flex items-center gap-1.5 w-full h-full ${canSort ? "cursor-pointer select-none hover:text-indigo-600" : ""} ${isStudent ? "justify-start" : "justify-center"}`}
                                                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                                                    >
                                                        <div className="whitespace-normal break-words">
                                                            {flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                        </div>
                                                        {canSort && (
                                                            <span className="text-[var(--color-white)] shrink-0 font-normal transition-transform duration-150">
                                                                {sortStatus === "asc" ? (
                                                                    <ArrowUp size={14} />
                                                                ) : sortStatus === "desc" ? (
                                                                    <ArrowDown size={14} />
                                                                ) : (
                                                                    <ArrowUpDown size={14} />
                                                                )}
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
                            {displayRows.map((row) => (
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
                                                px-3 py-1.5 text-sm border-r border-zinc-100 whitespace-nowrap align-middle border-b-1
                                                ${cellWidthClass}
                                                ${isStudent ? "font-medium group-hover:bg-indigo-50/10 bg-white z-20" : ""}
                                                ${isFinal ? "bg-white z-20" : ""}
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

                            {emptyRowsCount > 0 && Array.from({ length: emptyRowsCount }).map((_, idx) => (
                                <tr key={`empty-row-${idx}`} className="odd:bg-white even:bg-zinc-50/40 h-[37px]">
                                    {table.getAllLeafColumns().map((column) => {
                                        const isStudent = column.id === "student";
                                        const isFinal = column.id === "finalScore";

                                        let cellWidthClass = CLS_SCORE_COL;
                                        if (isStudent) cellWidthClass = CLS_STICKY_LEFT;
                                        if (isFinal) cellWidthClass = CLS_STICKY_RIGHT;

                                        return (
                                            <td
                                                key={column.id}
                                                className={`
                                                px-3 py-1.5 border-r border-zinc-100 border-b border-zinc-100/60 
                                                ${cellWidthClass}
                                                ${isStudent ? "bg-white z-20" : ""}
                                                ${isFinal ? "bg-white z-20" : ""}
                                            `}
                                            >
                                                &nbsp;
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </SimpleBar>
            </div>

            {/* Pagination Controls Section */}
            <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border border-zinc-200 rounded-xl shadow-sm text-xs">
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="text-zinc-500 font-medium py-0.5">
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