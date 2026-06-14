"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { User } from "@/services/authService";
import api from "@/utils/axiosConfig";
import { Course, getTeacherCourses } from "@/services/courseService";

import CenterHeader from "./components/CenterHeader";
import CenterTabs from "./components/CenterTabs";
import CourseListTab from "./components/CourseListTab";
import TeacherListTab from "./components/TeacherListTab";
import SubjectListTab from "./components/SubjectListTab";
import GradeListTab from "./components/GradeListTab";
import ClassroomTab from "./components/ClassroomTab";
import ClassSlotTab from "./components/ClassSlotTab";
import StudentTab from "./components/StudentTab";
import CenterFinanceTab from "./components/CenterFinanceTab";

type StudentCenterCard = User & {
    courses: { id: number; name: string }[];
};

type CenterInfo = {
    id: number;
    name: string;
    description?: string;
    manager: {
        id: number;
    };
};

type TabType = "courses" | "students" | "teachers" | "subjects" | "grades" | "classrooms" | "class-slots" | "finance";

export default function CenterDetailPage() {
    const params = useParams();
    const centerId = Number(params.id);

    const [centerInfo, setCenterInfo] = useState<CenterInfo | null>(null);
    const [isManager, setIsManager] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("courses");
    const [loading, setLoading] = useState(true);

    const [courses, setCourses] = useState<Course[]>([]);
    const [teachers, setTeachers] = useState<User[]>([]);
    const [centerStudents, setCenterStudents] = useState<StudentCenterCard[]>([]);

    const fetchData = useCallback(async () => {
        if (!centerId) return;

        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const user = JSON.parse(userStr);

        try {
            setLoading(true);

            // Fetch structural core resources in parallel safely
            const [resCenter, resStudents] = await Promise.all([
                api.get<CenterInfo>(`/centers/${centerId}`),
                api.get<any[]>(`/centers/${centerId}/students`)
            ]);

            setCenterInfo(resCenter.data);
            const managerCheck = resCenter.data.manager.id === user.id;
            setIsManager(managerCheck);

            const students = resStudents.data ?? [];

            // Get target courses based on user permissions
            const fetchedCourses: Course[] = managerCheck
                ? (await api.get(`/courses?centerId=${centerId}`)).data
                : (await getTeacherCourses(user.id)).filter(
                    (course: Course) => course.center?.id === centerId
                );

            setCourses(fetchedCourses);

            // OPTIMIZATION: Process student metadata mapping concurrently
            const courseMembers = await Promise.all(
                fetchedCourses.map(async (course: Course) => {
                    try {
                        const res = await api.get(`/courses/${course.id}/students`);
                        return {
                            courseId: course.id,
                            courseName: course.name,
                            students: (res.data ?? []) as Array<{ id: number }>,
                        };
                    } catch (err) {
                        return {
                            courseId: course.id,
                            courseName: course.name,
                            students: [],
                        };
                    }
                })
            );

            // Build optimized relational lookup index
            const studentCoursesMap = new Map<number, { id: number; name: string }[]>();
            for (const cm of courseMembers) {
                for (const st of cm.students) {
                    const list = studentCoursesMap.get(st.id) ?? [];
                    list.push({ id: cm.courseId, name: cm.courseName });
                    studentCoursesMap.set(st.id, list);
                }
            }

            const cardStudents = students
                .map((s: any): StudentCenterCard => ({
                    ...s,
                    courses: studentCoursesMap.get(s.id) ?? [],
                }))
                .filter((student: StudentCenterCard) => managerCheck || student.courses.length > 0);

            setCenterStudents(cardStudents);

            if (managerCheck) {
                const resTeachers = await api.get(`/centers/${centerId}/teachers`);
                setTeachers(resTeachers.data);
            }

        } catch (error) {
            console.error("Error compounding administrative data payload:", error);
        } finally {
            setLoading(false);
        }
    }, [centerId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3 p-10 animate-fade-in">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-sm font-semibold text-slate-500 tracking-medium">
                    Assembling administrative registry data...
                </p>
            </div>
        );
    }

return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in pb-12">
            {/* Navigation Back Button */}
            <div className="pt-2">
                <Link
                    href="/teacher/centers"
                    className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text)] opacity-80 transition-colors hover:text-[var(--color-main)] hover:opacity-100 group"
                >
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1 stroke-[2.5]" />
                    Back to Center Management Grid
                </Link>
            </div>

            {/* Core Center Details Presentation Card */}
            <CenterHeader center={centerInfo} isManager={isManager} />

            {/* Navigation Filter Selector Tabs Container */}
            <div className="bg-gray-50/60 border border-gray-200/60 p-2.5 rounded-2xl shadow-xs">
                <CenterTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isManager={isManager}
                />
            </div>

            {/* Context-Driven Active Tab Component Workspace Layer */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xl shadow-gray-100/40 min-h-[400px] transition-all duration-300 focus-within:border-[var(--color-main)]/30">
                {activeTab === "courses" && (
                    <CourseListTab
                        courses={courses}
                        centerId={centerId}
                        isManager={isManager}
                        onUpdate={fetchData}
                    />
                )}

                {activeTab === "subjects" && (
                    <SubjectListTab centerId={centerId} isManager={isManager} />
                )}

                {activeTab === "grades" && (
                    <GradeListTab centerId={centerId} isManager={isManager} />
                )}

                {activeTab === "classrooms" && (
                    <ClassroomTab centerId={centerId} isManager={isManager} />
                )}

                {activeTab === "class-slots" && (
                    <ClassSlotTab centerId={centerId} isManager={isManager} />
                )}

                {activeTab === "teachers" && (
                    <TeacherListTab
                        centerId={centerId}
                        teachers={teachers}
                        isManager={isManager}
                        onUpdate={fetchData}
                    />
                )}

                {activeTab === "students" && (
                    <StudentTab
                        centerId={centerId}
                        students={centerStudents}
                        isManager={isManager}
                        onUpdate={fetchData}
                    />
                )}

                {activeTab === "finance" && isManager && (
                    <CenterFinanceTab centerId={centerId} />
                )}
            </div>
        </div>
    );
}