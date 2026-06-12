"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import CourseForm, { CourseFormData } from "../../components/CourseForm";
import { getCourseById, updateCourse, endCourseEarly, reopenCourse, type Course } from "@/services/courseService";
import type { Center } from "@/services/centerService";
import toast from "react-hot-toast";
import { ArrowLeft, RotateCcw, Square } from "lucide-react";
import { getCourseStatusLabel } from "@/utils/courseStatus";

export default function EditCoursePage() {
    const router = useRouter();
    const params = useParams();
    const courseId = Number(params.id);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [course, setCourse] = useState<Course | null>(null);
    const [centers, setCenters] = useState<Center[]>([]);
    const [formData, setFormData] = useState<CourseFormData>({
        name: "",
        subjectId: undefined,
        gradeId: undefined,
        description: "",
        startDate: "",
        endDate: "",
        centerId: undefined,
    });

    const buildPayload = (data: CourseFormData) => {
        if (!course || !course.center?.id) {
            throw new Error("Course data is incomplete.");
        }

        return {
            name: data.name,
            subjectId: data.subjectId,
            gradeId: data.gradeId,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            centerId: Number(data.centerId || course.center.id),
            teacherId: course.teacher.id,
            tuitionFeeVnd: data.tuitionFeeVnd,
            slots: [],
        };
    };

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const data = await getCourseById(courseId) as Course;
                setCourse(data);
                setCenters(data.center ? [{
                    id: Number(data.center.id),
                    name: data.center.name,
                    description: "",
                    phoneNumber: "",
                    archivedAt: null,
                    manager: {
                        id: data.center.manager?.id || 0,
                        firstName: data.center.manager?.firstName || "",
                        lastName: data.center.manager?.lastName || "",
                    },
                }] : []);

                setFormData({
                    name: data.name,
                    subjectId: data.subject?.id,
                    gradeId: data.grade?.id,
                    description: data.description,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    centerId: data.center?.id,
                    tuitionFeeVnd: data.tuitionFeeVnd,
                });

            } catch {
                toast.error("Course not found!");
                router.back();
            } finally {
                setLoading(false);
            }
        };

        if (courseId) fetchDetail();
    }, [courseId, router]);

    const handleSubmit = async (data: CourseFormData) => {
        setSaving(true);

        try {
            const updated = await updateCourse(courseId, buildPayload(data));
            setCourse(updated);
            setFormData({
                name: updated.name,
                subjectId: updated.subject?.id,
                gradeId: updated.grade?.id,
                description: updated.description,
                startDate: updated.startDate,
                endDate: updated.endDate,
                centerId: updated.center?.id,
            });
            toast.success("Updated successfully!");

            if (updated.center?.id) {
                router.push(`/teacher/centers/${updated.center.id}`);
            }

        } catch (error: any) {
            const responseData = error?.response?.data;
            const message =
                responseData?.error ||
                responseData?.message ||
                (typeof responseData === "string" ? responseData : null) ||
                "Error saving!";
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleEndEarly = async () => {
        setActionLoading(true);

        try {
            const updated = await endCourseEarly(courseId);
            setCourse(updated);
            toast.success("Course ended early.");
        } catch (error: any) {
            const responseData = error?.response?.data;
            const message =
                responseData?.error ||
                responseData?.message ||
                (typeof responseData === "string" ? responseData : null) ||
                "Unable to end course early.";
            toast.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReopen = async () => {
        setActionLoading(true);

        try {
            const updated = await reopenCourse(courseId, buildPayload(formData));
            setCourse(updated);
            toast.success("Course reopened successfully.");
        } catch (error: any) {
            const responseData = error?.response?.data;
            const message =
                responseData?.error ||
                responseData?.message ||
                (typeof responseData === "string" ? responseData : null) ||
                "Unable to reopen course.";
            toast.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-10 text-center text-[var(--color-text)]">
                Loading course data...
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[var(--color-text)] hover:text-[var(--color-main)] transition text-sm"
            >
                <ArrowLeft size={18} />
                Cancel
            </button>

            <div className="rounded-xl border border-[var(--color-main)] bg-[var(--color-soft-white)] p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-main)]/20 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text)]">Edit Course</h1>
                        <p className="mt-1 text-sm text-[var(--color-text)]/70">
                            Current status: {course ? getCourseStatusLabel(course.status) : "-"}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {course?.status !== "ENDED" ? (
                            <button
                                type="button"
                                onClick={handleEndEarly}
                                disabled={actionLoading}
                                className="flex items-center gap-2 rounded-lg border-2 border-[var(--color-alert)] px-4 py-2 font-medium text-[var(--color-alert)] transition hover:bg-[var(--color-alert)] hover:text-white disabled:opacity-50"
                            >
                                <Square size={16} /> End Early
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleReopen}
                                disabled={actionLoading}
                                className="flex items-center gap-2 rounded-lg border-2 border-[var(--color-main)] px-4 py-2 font-medium text-[var(--color-main)] transition hover:bg-[var(--color-main)] hover:text-white disabled:opacity-50"
                            >
                                <RotateCcw size={16} /> Reopen Course
                            </button>
                        )}
                    </div>
                </div>

                {course?.status === "ENDED" && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Update the start date and end date, then click Reopen Course.
                    </div>
                )}

                <CourseForm
                    initialData={formData}
                    onSubmit={handleSubmit}
                    onChange={setFormData}
                    loading={saving}
                    centers={centers}
                    isCenterLocked={true}
                    btnLabel="Save Changes"
                />
            </div>
        </div>
    );
}