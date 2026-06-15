"use client";

import { useEffect, useState, useMemo } from "react";
import { getTeacherCourses, Course } from "@/services/courseService";
import { getMyCenters } from "@/services/centerService";
import { 
    Plus, 
    Search, 
    BookOpen, 
    ExternalLink, 
    Calendar, 
    Layers, 
    MapPin, 
    Loader2, 
    ChevronLeft, 
    ChevronRight, 
    SlidersHorizontal,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    X
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { CourseStatus, getCourseStatusClasses, getCourseStatusLabel } from "@/utils/courseStatus";

const ITEMS_PER_PAGE = 8;
type SortOrder = "asc" | "desc" | null;

export default function CourseListPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [canCreateCourse, setCanCreateCourse] = useState(false);
    
    // Core Filters & Query Inputs
    const [statusFilter, setStatusFilter] = useState<CourseStatus>("IN_PROGRESS");
    const [keyword, setKeyword] = useState("");
    const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
    const [centerFilter, setCenterFilter] = useState<string>("ALL");
    const [nameSortOrder, setNameSortOrder] = useState<SortOrder>(null);
    
    // Pagination Controls State
    const [currentPage, setCurrentPage] = useState(1);

    const statusOptions: CourseStatus[] = ["UPCOMING", "IN_PROGRESS", "ENDED"];

    const fetchCourses = async () => {
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr) return;
            const user = JSON.parse(userStr);

            const [data, managedCenters] = await Promise.all([
                getTeacherCourses(user.id),
                getMyCenters(user.id),
            ]);
            setCourses(data);
            setCanCreateCourse(managedCenters.length > 0);
        } catch (error) {
            toast.error("Unable to load course list");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    // Reset pagination window placement whenever base filter matrices change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, keyword, subjectFilter, centerFilter]);

    // Derived unique list parameters for select inputs
    const { uniqueSubjects, uniqueCenters } = useMemo(() => {
        const subjectsSet = new Set<string>();
        const centersSet = new Set<string>();

        courses.forEach((course) => {
            if (course.subject?.name) subjectsSet.add(course.subject.name);
            if (course.center?.name) centersSet.add(course.center.name);
        });

        return {
            uniqueSubjects: Array.from(subjectsSet).sort(),
            uniqueCenters: Array.from(centersSet).sort()
        };
    }, [courses]);

    // Sort Toggle Handler
    const handleSortToggle = () => {
        if (nameSortOrder === null) setNameSortOrder("asc");
        else if (nameSortOrder === "asc") setNameSortOrder("desc");
        else setNameSortOrder(null);
    };

    // Reset all optional select criteria filters
    const handleResetFilters = () => {
        setKeyword("");
        setSubjectFilter("ALL");
        setCenterFilter("ALL");
        setNameSortOrder(null);
    };

    // Advanced Matrix Filter Engine
    const processedCourses = useMemo(() => {
        // Step 1: Filtering matching state variables
        let results = courses.filter((course) => {
            const matchesStatus = course.status === statusFilter;
            
            const matchesSubject = subjectFilter === "ALL" || course.subject?.name === subjectFilter;
            const matchesCenter = centerFilter === "ALL" || course.center?.name === centerFilter;

            const searchLower = keyword.toLowerCase().trim();
            const matchesSearch = !searchLower ? true : (
                course.name?.toLowerCase().includes(searchLower) ||
                course.subject?.name?.toLowerCase().includes(searchLower) ||
                course.center?.name?.toLowerCase().includes(searchLower) ||
                course.grade?.name?.toLowerCase().includes(searchLower)
            );

            return matchesStatus && matchesSubject && matchesCenter && matchesSearch;
        });

        // Step 2: Sorting operations
        if (nameSortOrder) {
            results = [...results].sort((a, b) => {
                const nameA = a.name?.toLowerCase() || "";
                const nameB = b.name?.toLowerCase() || "";
                return nameSortOrder === "asc" 
                    ? nameA.localeCompare(nameB) 
                    : nameB.localeCompare(nameA);
            });
        }

        return results;
    }, [courses, statusFilter, keyword, subjectFilter, centerFilter, nameSortOrder]);

    // Window Pagination Math Slicing
    const totalPages = Math.ceil(processedCourses.length / ITEMS_PER_PAGE) || 1;
    const paginatedCourses = useMemo(() => {
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        return processedCourses.slice(offset, offset + ITEMS_PER_PAGE);
    }, [processedCourses, currentPage]);

    // Active Filters Indicator Count
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (keyword) count++;
        if (subjectFilter !== "ALL") count++;
        if (centerFilter !== "ALL") count++;
        if (nameSortOrder !== null) count++;
        return count;
    }, [keyword, subjectFilter, centerFilter, nameSortOrder]);

    return (
        <div className="max-w-[1600px] mx-auto p-1 sm:p-4 space-y-6 antialiased text-slate-800">

            {/* Header segment layout wrapper */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
                        <BookOpen size={28} className="text-[var(--color-main)]" />
                        Manage Courses
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        Track progress, filter rosters, manage material repositories, and configure records.
                    </p>
                </div>

                {canCreateCourse && (
                    <Link
                        href={`/teacher/courses/create`}
                        className="inline-flex items-center justify-center gap-2 bg-[var(--color-main)] text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:opacity-90 active:scale-[0.98] transition-all duration-200"
                    >
                        <Plus size={18} />
                        Create New Course
                    </Link>
                )}
            </div>

            {/* Advanced Filters Panel Dashboard */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                
                {/* Horizontal Level 1: Key-Search bar and Main Status Tabs switcher */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                    
                    {/* Integrated Search Box Input */}
                    <div className="relative lg:col-span-2">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Search by course name, center, grade..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 focus:border-[var(--color-main)] transition-all placeholder-slate-400 font-medium"
                        />
                    </div>

                    {/* Master Status Tabs switcher layout container */}
                    <div className="flex bg-slate-100 p-1 rounded-xl w-full">
                        {statusOptions.map((status) => {
                            const isActive = statusFilter === status;
                            return (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setStatusFilter(status)}
                                    className={`flex-1 text-center rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                                        isActive
                                            ? "bg-white text-[var(--color-main)] shadow-sm"
                                            : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    {getCourseStatusLabel(status)}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Horizontal Level 2: Sub-dropdown category parameters select widgets mapping */}
                <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 max-w-2xl">
                        
                        {/* Dynamic Subject Select Parameter mapping row */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Calendar size={12} /> Filter by Subject
                            </label>
                            <select
                                value={subjectFilter}
                                onChange={(e) => setSubjectFilter(e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 transition-all cursor-pointer"
                            >
                                <option value="ALL">All Subjects</option>
                                {uniqueSubjects.map((sub) => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>

                        {/* Dynamic Center Selection Dropdown Menu mapping field */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <MapPin size={12} /> Filter by Center
                            </label>
                            <select
                                value={centerFilter}
                                onChange={(e) => setCenterFilter(e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 transition-all cursor-pointer"
                            >
                                <option value="ALL">All Centers</option>
                                {uniqueCenters.map((center) => (
                                    <option key={center} value={center}>{center}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Reset all active custom adjustments widget button */}
                    {activeFiltersCount > 0 && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="self-end md:self-center inline-flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-all duration-150 border border-red-200/40"
                        >
                            <X size={14} />
                            Reset Filters ({activeFiltersCount})
                        </button>
                    )}
                </div>
            </div>

            {/* Table Dynamic Counter Descriptor context tracker line */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-[var(--color-main)] rounded-full" />
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                        {getCourseStatusLabel(statusFilter)} Courses Block ({processedCourses.length})
                    </h2>
                </div>
                <span className="text-xs text-slate-400 font-medium font-mono">
                    Showing {processedCourses.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, processedCourses.length)}
                </span>
            </div>

            {/* Dynamic Interactive Master Roster View Box Panel wrapper */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-[var(--color-main)]" size={32} />
                        <p className="text-sm font-semibold tracking-wide">Loading matching indexes...</p>
                    </div>
                ) : paginatedCourses.length === 0 ? (
                    <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center max-w-md mx-auto">
                        <div className="p-4 bg-slate-50 rounded-full mb-4 border border-slate-100">
                            <SlidersHorizontal size={30} className="text-slate-400" />
                        </div>
                        <h3 className="text-slate-800 font-bold text-base mb-1">No Results Matches Criteria</h3>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            Try shifting status parameters or reset search filters to target alternate courses.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-[var(--color-main)] border-b border-slate-200 text-white font-bold text-xs uppercase tracking-wider select-none">
                                    <th 
                                        className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100/80 transition-colors group"
                                        onClick={handleSortToggle}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>Course Information</span>
                                            <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
                                                {nameSortOrder === "asc" && <ArrowUp size={14} className="text-[var(--color-main)]" />}
                                                {nameSortOrder === "desc" && <ArrowDown size={14} className="text-[var(--color-main)]" />}
                                                {nameSortOrder === null && <ArrowUpDown size={14} />}
                                            </span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 font-bold hidden sm:table-cell">Subject</th>
                                    <th className="px-6 py-4 font-bold hidden md:table-cell">Affiliated Center</th>
                                    <th className="px-6 py-4 font-bold text-center">Status</th>
                                    <th className="px-6 py-4 font-bold text-right">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {paginatedCourses.map((course) => (
                                    <tr
                                        key={course.id}
                                        className="hover:bg-slate-50/50 transition-colors duration-150 group"
                                    >
                                        {/* Main metadata stack */}
                                        <td className="px-6 py-4.5">
                                            <div className="font-bold text-[var(--color-text)] group-hover:text-[var(--color-main)] transition-colors line-clamp-2 max-w-[320px]">
                                                {course.name}
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1.5 bg-slate-100 px-2 py-0.5 rounded-md">
                                                <Layers size={12} />
                                                <span>Grade {course.grade?.name || "N/A"}</span>
                                            </div>
                                        </td>

                                        {/* Subject block tracking cell */}
                                        <td className="px-6 py-4.5 hidden sm:table-cell font-medium text-[var(--color-text)]">
                                            <div className="inline-flex items-center gap-1.5">
                                                <span>{course.subject?.name || "Unassigned"}</span>
                                            </div>
                                        </td>

                                        {/* Affiliated Center cell */}
                                        <td className="px-6 py-4.5 hidden md:table-cell text-[var(--color-text)] font-medium max-w-[220px] truncate">
                                            <div className="inline-flex items-center gap-1.5 text-[var(--color-text)]">
                                                <MapPin size={14} className="text-slate-400 shrink-0" />
                                                <span className="truncate">{course.center?.name || "Main Campus"}</span>
                                            </div>
                                        </td>

                                        {/* Soft Status Indicator pill wrapper */}
                                        <td className="px-6 py-4.5 text-center whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${getCourseStatusClasses(course.status)}`}
                                            >
                                                {getCourseStatusLabel(course.status)}
                                            </span>
                                        </td>

                                        {/* Action controls layout cell */}
                                        <td className="px-6 py-4.5 text-right whitespace-nowrap">
                                            <Link
                                                href={`/teacher/courses/${course.id}`}
                                                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--color-main)] bg-[var(--color-main)]/5 hover:bg-[var(--color-main)] hover:text-white px-3 py-2 rounded-xl transition-all duration-200 active:scale-95 shadow-sm border border-[var(--color-main)]/10"
                                                title="View Workspace Dashboard"
                                            >
                                                <span>Open</span>
                                                <ExternalLink size={14} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer Window Pagination Control Toolbar wrapper */}
                {processedCourses.length > ITEMS_PER_PAGE && (
                    <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between select-none">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            <ChevronLeft size={14} />
                            Previous
                        </button>

                        <div className="hidden sm:flex items-center gap-1.5">
                            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => {
                                const isCurrent = page === currentPage;
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all duration-150 ${
                                            isCurrent
                                                ? "bg-[var(--color-main)] text-white shadow-sm"
                                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            Next
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}