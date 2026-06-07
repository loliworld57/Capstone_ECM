"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    MapPin,
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
import CourseAttendance from "./components/CourseAttendance";
import NotFound from "@/app/not-found";
import CourseMaterials from "./components/CourseMaterial";
import CourseAssignments from "./components/CourseAssignment";
import { formatDateValue } from "@/utils/dateFormat";
import { getCourseStatusClasses, getCourseStatusLabel } from "@/utils/courseStatus";

export default function CourseDetailPage() {
    const params = useParams();
    const courseId = Number(params.id);
    const router = useRouter();

    const [course, setCourse] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<
        "General Info" | "Attendance" | "Materials" | "Assignments"
    >("General Info");

    const [loading, setLoading] = useState(true);
    const [isManager, setIsManager] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const data = await getCourseById(courseId);
                setCourse(data);

                const userStr = localStorage.getItem("user");

                if (userStr && data.center && data.center.manager) {
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
            <div className="p-10 text-center text-[var(--color-text)]">
                Loading data...
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
        <div className=" mx-auto space-y-6 pb-10">

            {/* BACK BUTTON */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[var(--color-text)] hover:text-[var(--color-main)] text-sm transition hover:underline"
            >
                <ArrowLeft size={18} />
                Back to list
            </button>

            {/* COURSE HEADER */}
            <div className="bg-[var(--color-soft-white)] border-b-4 border-[var(--color-main)] shadow-sm p-8">

                <div className="flex justify-between items-start">

                    <div>

                        <div className="flex items-center gap-3 mb-2">

                            <h1 className="text-3xl font-bold text-[var(--color-text)]">
                                {course.name}
                            </h1>

                            <span
                                className={`px-3 py-1 rounded text-xs font-semibold border ${getCourseStatusClasses(course.status)}`}
                            >
                                {getCourseStatusLabel(course.status)}
                            </span>

                        </div>

                        <p className="text-[var(--color-text)] flex items-center gap-2 mt-2">

                            <PencilLine
                                size={18}
                                className="text-[var(--color-main)]"
                            />

                            {course.center?.name || "Center not updated"}

                        </p>
                    </div>
                </div>

            </div>

            {/* TABS */}
            <TabsInCourse
                activeTab={activeTab}
                setActiveTab={setActiveTab as any}
                isManager={isManager}
            />

            {/* GENERAL INFO */}
            {activeTab === "General Info" && (

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* DESCRIPTION */}
                    <div className="md:col-span-2 space-y-6">

                        <div className="bg-[var(--color-soft-white)] border border-[var(--color-main)] rounded-xl shadow-sm p-6">

                            <h3 className="font-bold text-[var(--color-text)] mb-4 border-b pb-2">
                                Course description
                            </h3>

                            <p className="text-[var(--color-text)] leading-relaxed whitespace-pre-line">

                                {course.description ||
                                    "No detailed description is available for this course."}
                            </p>
                        </div>

                    </div>

                    {/* COURSE INFO */}
                    <div className="space-y-6">

                        <div className="bg-[var(--color-soft-white)] border border-[var(--color-main)] rounded-xl shadow-sm p-6">

                            <h3 className="font-bold text-[var(--color-text)] mb-4 border-b pb-2">
                                Class information
                            </h3>

                            <div className="space-y-4">



                                {/* TEACHER */}
                                <div className="flex items-center gap-3">

                                    <div className="p-2 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-lg">
                                        <User size={20} />
                                    </div>

                                    <div>

                                        <p className="text-xs text-gray-500">
                                            Instructor
                                        </p>

                                        <p className="font-medium text-[var(--color-text)]">
                                            {course.teacher?.lastName}{" "}
                                            {course.teacher?.firstName}
                                        </p>

                                    </div>

                                </div>

                                {/* SCHEDULE */}
                                <div className="flex items-center gap-3">

                                    <div className="p-2 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-lg">
                                        <Calendar size={20} />
                                    </div>

                                    <div>

                                        <p className="text-xs text-gray-500">
                                            Schedule
                                        </p>

                                        <p className="font-medium text-[var(--color-text)] text-sm">

                                            {formatDateValue(course.startDate)}

                                            <span className="text-gray-400 mx-1">
                                                →
                                            </span>

                                            {formatDateValue(course.endDate)}

                                        </p>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>
            )}


            {/* MATERIALS */}
            {activeTab === "Materials" && (
                <div>
                    <CourseMaterials courseId={courseId} />
                </div>
            )}

            {/* ASSIGNMENTS */}
            {activeTab === "Assignments" && (
                <div>
                    <CourseAssignments courseId={courseId} />
                </div>
            )}

            {/* ATTENDANCE */}
            {activeTab === "Attendance" && (
                <div>
                    <CourseAttendance courseId={courseId} />
                </div>
            )}

        </div>
    );
}