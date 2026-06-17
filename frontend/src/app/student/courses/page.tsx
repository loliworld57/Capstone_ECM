"use client";

import { useEffect, useState, useMemo } from "react";
import { getStudentCourses, Course } from "@/services/courseService";
import { 
    BookOpen, 
    ExternalLink, 
    Filter, 
    ChevronDown, 
    Search, 
    X, 
    Calendar, 
    Activity, 
    Bookmark, 
    MapPin, 
    ChevronLeft, 
    ChevronRight 
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { getCourseStatusClasses, getCourseStatusLabel } from "@/utils/courseStatus";

const ITEMS_PER_PAGE = 6; // Configured for a neat 3x2 grid layout per page

export default function CourseListPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCenterId, setSelectedCenterId] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);

    const currentCourses = useMemo(() => {
        return courses.filter(
            (course) => course.status === "UPCOMING" || course.status === "IN_PROGRESS"
        );
    }, [courses]);

    // Unique center choices lookup table
    const centerOptions = useMemo(() => {
        return Array.from(
            new Map(
                currentCourses
                    .filter((course) => typeof course.center?.id === "number")
                    .map((course) => [course.center.id as number, course.center])
            ).values()
        ).sort((left, right) => left.name.localeCompare(right.name));
    }, [currentCourses]);

    // Multi-criteria client side filtering processing pipeline
    const filteredCourses = useMemo(() => {
        return currentCourses.filter((course) => {
            const matchesCenter = selectedCenterId === "ALL" || course.center?.id === Number(selectedCenterId);
            const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCenter && matchesSearch;
        });
    }, [currentCourses, selectedCenterId, searchQuery]);

    // Reset page to index 1 on dynamic selection filter adjustments
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCenterId, searchQuery]);

    // Pagination window calculations
    const totalPages = Math.max(1, Math.ceil(filteredCourses.length / ITEMS_PER_PAGE));
    const paginatedCourses = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredCourses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredCourses, currentPage]);

    const fetchCourses = async () => {
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr) return;
            const user = JSON.parse(userStr);

            const data = await getStudentCourses(user.id);
            setCourses(data);
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

    // Inline status helper indicator mapping configuration logic
    const renderStatusIcon = (status: string) => {
        if (status === "IN_PROGRESS") {
            return <Activity size={12} className="mr-1 animate-pulse" />;
        }
        return <Calendar size={12} className="mr-1" />;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            
            {/* Header Section */}
            <div className="border-b border-slate-100 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-[var(--color-text)] flex items-center gap-2.5">
                        <BookOpen className="text-[var(--color-main)] stroke-[2.5]" size={26} />
                        Current Courses
                    </h1>
                    <p className="text-xs font-semibold text-[var(--color-text)]/60 mt-1">
                        Manage and review your upcoming and active curricular tracks.
                    </p>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:max-w-xl shrink-0">
                    
                    {/* Text Search Inputs */}
                    <div className="relative w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by course name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-xs font-medium text-[var(--color-text)] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[var(--color-main)] focus:ring-4 focus:ring-[var(--color-main)]/10"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Center Select Dropdowns */}
                    <div className="relative w-full sm:max-w-xs shrink-0">
                        <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={selectedCenterId}
                            onChange={(event) => setSelectedCenterId(event.target.value)}
                            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-xs font-bold text-[var(--color-text)] outline-none transition hover:border-slate-300 focus:border-[var(--color-main)] focus:ring-4 focus:ring-[var(--color-main)]/10"
                        >
                            <option value="ALL">All Centers</option>
                            {centerOptions.map((center) => (
                                <option key={center.id} value={center.id}>
                                    {center.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((loaderId) => (
                        <div key={loaderId} className="bg-white rounded-2xl border border-slate-200/60 p-6 space-y-5 animate-pulse">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                                    <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                                </div>
                                <div className="h-6 bg-slate-200 rounded-full w-20"></div>
                            </div>
                            <div className="space-y-2 pt-2">
                                <div className="h-10 bg-slate-50 rounded-xl"></div>
                                <div className="h-10 bg-slate-50 rounded-xl"></div>
                            </div>
                            <div className="h-9 bg-slate-200 rounded-lg w-28 ml-auto"></div>
                        </div>
                    ))}
                </div>
            ) : paginatedCourses.length === 0 ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-16 text-center shadow-2xs flex flex-col items-center justify-center max-w-md mx-auto">
                    <div className="p-4 bg-slate-50 rounded-full border border-slate-100 text-[var(--color-text)]/30 mb-4 shadow-inner">
                        <BookOpen size={32} className="stroke-[1.5]" />
                    </div>
                    <h3 className="text-sm font-bold text-[var(--color-text)]">No active segments found</h3>
                    <p className="text-xs font-medium text-[var(--color-text)]/60 mt-1.5 leading-relaxed">
                        No upcoming or active academic courses match your chosen center or name search parameters.
                    </p>
                </div>
            ) : (
                <>
                    {/* Balanced 3x2 Grid Grid-Deck */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                        {paginatedCourses.map((course) => (
                            <div
                                key={course.id}
                                className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[var(--color-main)]/40 flex flex-col justify-between h-full min-h-[290px]"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-black text-[var(--color-text)] tracking-tight group-hover:text-[var(--color-main)] transition-colors break-words line-clamp-2">
                                                {course.name}
                                            </h3>
                                            <p className="mt-1 text-[10px] font-bold text-[var(--color-text)]/50 uppercase tracking-wider">
                                                Grade {course.grade?.name || "—"}
                                            </p>
                                        </div>

                                        <span
                                            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-black tracking-wide uppercase border ${getCourseStatusClasses(course.status)}`}
                                        >
                                            {renderStatusIcon(course.status)}
                                            {getCourseStatusLabel(course.status)}
                                        </span>
                                    </div>

                                    {/* Info Ledger Strip Blocks */}
                                    <div className="mt-5 space-y-2">
                                        <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50/60 px-3.5 py-2.5 border border-slate-100">
                                            <span className="text-[10px] font-bold text-[var(--color-text)]/50 uppercase tracking-wider flex items-center gap-1.5">
                                                <Bookmark size={12} className="text-slate-400" />
                                                Subject
                                            </span>
                                            <span className="text-xs font-black text-[var(--color-text)] text-right truncate max-w-[150px]">{course.subject?.name || "—"}</span>
                                        </div>

                                        <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50/60 px-3.5 py-2.5 border border-slate-100">
                                            <span className="text-[10px] font-bold text-[var(--color-text)]/50 uppercase tracking-wider flex items-center gap-1.5">
                                                <MapPin size={12} className="text-slate-400" />
                                                Location
                                            </span>
                                            <span className="text-xs font-black text-[var(--color-text)] text-right truncate max-w-[150px]">{course.center?.name || "—"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Button Drawer Footer Row */}
                                <div className="mt-6 pt-4 border-t border-slate-100/60 flex justify-end">
                                    <Link
                                        href={`/student/courses/${course.id}`}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-main)] px-4 py-2 text-xs font-black text-white shadow-xs transition-all duration-200 hover:bg-[var(--color-main)]/90 hover:shadow-sm"
                                    >
                                        Open Course Ledger
                                        <ExternalLink size={13} className="stroke-[2.5]" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Strip Element Block */}
                    {totalPages > 0 && (
                        <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                            <p className="text-xs font-semibold text-slate-500">
                                Showing <span className="font-bold text-[var(--color-text)]">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="font-bold text-[var(--color-text)]">{Math.min(currentPage * ITEMS_PER_PAGE, filteredCourses.length)}</span> of <span className="font-bold text-[var(--color-text)]">{filteredCourses.length}</span> entries
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 transition enabled:hover:bg-slate-50 enabled:hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <div className="flex items-center text-xs font-bold text-[var(--color-text)] px-3">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 transition enabled:hover:bg-slate-50 enabled:hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}