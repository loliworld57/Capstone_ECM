"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Edit,
    Calendar,
    Book,
    User,
    GraduationCap,
    PencilLine
} from "lucide-react";
import { getCourseById } from "@/services/courseService";
import toast from "react-hot-toast";
import TabsInCourse from "./components/TabsInCourse";
import CourseEnrollment from "./components/CourseEnrollment";
import CourseAttendance from "./components/CourseAttendance";
import StudentList from "./components/StudentList";
import NotFound from "@/app/not-found";
import CourseMaterials from "./components/CourseMaterial";
import CourseAssignments from "./components/CourseAssignment";
import GradebookSection from "./components/GradebookSection";
import CourseFinanceTab from "./components/CourseFinanceTab";
import { formatDateValue } from "@/utils/dateFormat";
import { getCourseStatusClasses, getCourseStatusLabel } from "@/utils/courseStatus";
import CourseQuizzes from "./components/CourseQuizzes";

export default function CourseDetailPage() {
    const params = useParams();
    const courseId = Number(params?.id);
    const router = useRouter();

    const [course, setCourse] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<
        "General Info" | "Students" | "Attendance" | "Enrollment" | "Materials" | "Assignments" | "Gradebook" | "Quiz" | "Finance"
    >("General Info");

    const [loading, setLoading] = useState(true);
    const [isManager, setIsManager] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                setLoading(true);
                const data = await getCourseById(courseId);
                setCourse(data);

                const userStr = localStorage.getItem("user");

                if (userStr && data?.center?.manager) {
                    const currentUser = JSON.parse(userStr);
                    if (currentUser.id === data.center.manager.id) {
                        setIsManager(true);
                    }
                }
            } catch (error) {
                toast.error("Unable to load course details");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (courseId) fetchDetail();
    }, [courseId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-16 text-[var(--color-text)]/60 font-medium bg-white">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-[var(--color-main)] border-t-transparent rounded-full animate-spin" />
                    <span>Loading course operational data...</span>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="p-10 text-center text-red-500">
                <NotFound />
            </div>
        );
    }

    return (
        <div className="mx-auto space-y-6 pb-10 max-w-[1600px] p-1">
            
            {/* BACK BUTTON */}
            <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-[var(--color-text)]/70 hover:text-[var(--color-main)] text-sm font-semibold transition-colors group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                Back to courses
            </button>

            {/* COURSE HERO HEADER */}
            <div className="bg-white border border-[var(--color-text)]/15 border-b-4 border-b-[var(--color-main)] rounded-xl shadow-sm p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text)]">
                                {course.name}
                            </h1>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getCourseStatusClasses(course.status)}`}>
                                {getCourseStatusLabel(course.status)}
                            </span>
                        </div>

                        <p className="text-sm font-medium text-[var(--color-text)]/70 flex items-center gap-2">
                            <PencilLine size={16} className="text-[var(--color-main)] shrink-0" />
                            {course.center?.name || "No Center Assigned"}
                        </p>
                    </div>

                    <Link
                        href={`/teacher/courses/${courseId}/edit`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-[var(--color-main)] text-white hover:opacity-90 transition-all shadow-sm active:scale-[0.98] shrink-0"
                    >
                        <Edit size={16} />
                        Edit Course
                    </Link>
                </div>
            </div>

            {/* TABS INTERACTION SECTION */}
            <TabsInCourse
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isManager={isManager}
                courseId={courseId}
            />

            {/* DYNAMIC CONTENT SWITCHBOARD */}
            {activeTab === "General Info" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* CORE DESCRIPTION CONTENT */}
                    <div className="md:col-span-2">
                        <div className="bg-white border border-[var(--color-text)]/15 rounded-xl shadow-sm p-6 space-y-4">
                            <h3 className="font-bold text-base text-[var(--color-text)] border-b border-[var(--color-text)]/10 pb-3">
                                Course Description
                            </h3>
                            <p className="text-[var(--color-text)]/80 text-sm leading-relaxed whitespace-pre-line">
                                {course.description || "No detailed description is available for this course."}
                            </p>
                        </div>
                    </div>

                    {/* METRICS & PARAMETERS SIDEBAR */}
                    <div className="space-y-6">
                        <div className="bg-white border border-[var(--color-text)]/15 rounded-xl shadow-sm p-6 space-y-5">
                            <h3 className="font-bold text-base text-[var(--color-text)] border-b border-[var(--color-text)]/10 pb-3">
                                Class Specifications
                            </h3>

                            <div className="space-y-4">
                                {/* SUBJECT PROFILE */}
                                <div className="flex items-center gap-3.5">
                                    <div className="p-2.5 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl border border-[var(--color-main)]/10 shrink-0">
                                        <Book size={18} className="stroke-[2.5]" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-medium text-[var(--color-text)]/40 uppercase tracking-wide">Subject</p>
                                        <p className="text-sm font-semibold text-[var(--color-text)]">{course.subject?.name || "—"}</p>
                                    </div>
                                </div>

                                {/* GRADE / TARGET LEVEL AGE */}
                                <div className="flex items-center gap-3.5">
                                    <div className="p-2.5 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl border border-[var(--color-main)]/10 shrink-0">
                                        <GraduationCap size={18} className="stroke-[2.5]" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-[var(--color-text)]/40 uppercase tracking-wide">Target Group</p>
                                        {course.grade ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-[var(--color-main)]/10 text-[var(--color-main)] border border-[var(--color-main)]/20">
                                                {course.grade.name}
                                                {course.grade.fromAge != null && course.grade.toAge != null && (
                                                    <span className="ml-1 font-semibold opacity-80">
                                                        (Ages {course.grade.fromAge}-{course.grade.toAge})
                                                    </span>
                                                )}
                                            </span>
                                        ) : (
                                            <p className="text-sm font-semibold text-[var(--color-text)]">—</p>
                                        )}
                                    </div>
                                </div>

                                {/* ASSIGNED INSTRUCTOR */}
                                <div className="flex items-center gap-3.5">
                                    <div className="p-2.5 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl border border-[var(--color-main)]/10 shrink-0">
                                        <User size={18} className="stroke-[2.5]" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-medium text-[var(--color-text)]/40 uppercase tracking-wide">Instructor</p>
                                        <p className="text-sm font-semibold text-[var(--color-text)]">
                                            {course.teacher ? `${course.teacher.lastName} ${course.firstName || ""}` : "Unassigned"}
                                        </p>
                                    </div>
                                </div>

                                {/* TIMELINE / SCHEDULE */}
                                <div className="flex items-center gap-3.5">
                                    <div className="p-2.5 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl border border-[var(--color-main)]/10 shrink-0">
                                        <Calendar size={18} className="stroke-[2.5]" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-medium text-[var(--color-text)]/40 uppercase tracking-wide">Operational Timeline</p>
                                        <div className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-1.5 flex-wrap">
                                            <span>{formatDateValue(course.startDate)}</span>
                                            <span className="text-[var(--color-text)]/30 font-normal">→</span>
                                            <span>{formatDateValue(course.endDate)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "Students" && (
                <div className="bg-white border border-[var(--color-text)]/15 rounded-xl overflow-hidden shadow-sm">
                    <StudentList courseId={courseId} />
                </div>
            )}

            {activeTab === "Materials" && (
                <div className="bg-white border border-[var(--color-text)]/15 rounded-xl overflow-hidden shadow-sm">
                    <CourseMaterials courseId={courseId} />
                </div>
            )}

            {activeTab === "Assignments" && (
                <div className="bg-white border border-[var(--color-text)]/15 rounded-xl overflow-hidden shadow-sm">
                    <CourseAssignments courseId={courseId} />
                </div>
            )}

            {activeTab === "Gradebook" && (
                <div className="bg-white border border-[var(--color-text)]/15 rounded-xl overflow-hidden shadow-sm">
                    <GradebookSection courseId={courseId} />
                </div>
            )}

            {activeTab === "Quiz" && (
                <div className="bg-white border border-[var(--color-text)]/15 rounded-xl overflow-hidden shadow-sm">
                    <CourseQuizzes courseId={courseId} />
                </div>
            )}

            {activeTab === "Attendance" && (
                <div className="bg-white border border-[var(--color-text)]/15 rounded-xl overflow-hidden shadow-sm">
                    <CourseAttendance courseId={courseId} />
                </div>
            )}

            {activeTab === "Enrollment" && isManager && (
                <div className="bg-white border border-[var(--color-text)]/15 rounded-xl overflow-hidden shadow-sm">
                    <CourseEnrollment courseId={courseId} />
                </div>
            )}

            {activeTab === "Finance" && isManager && (
                <div className="bg-white border border-[var(--color-text)]/15 rounded-xl overflow-hidden shadow-sm p-6">
                    <CourseFinanceTab courseId={courseId} isManager={isManager} />
                </div>
            )}

        </div>
    );
}