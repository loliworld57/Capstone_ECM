import Link from "next/link";
import { Plus, Trash2, Mail, BookOpen, Settings, Info, Search, ArchiveRestore } from "lucide-react";
import { Course, getArchivedCoursesByCenter, restoreCourse } from "@/services/courseService";
import InviteTeacherModal from "./InviteTeacherModal";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import DeleteCourseOtpModal from "./DeleteCourseOtpModal";
import { CourseStatus, getCourseStatusClasses, getCourseStatusLabel, isCourseEnded } from "@/utils/courseStatus";
interface Props {
    courses: Course[];
    centerId: number;
    isManager: boolean;
    onUpdate: () => void;
}

export default function CourseListTab({ courses, centerId, isManager, onUpdate }: Props) {

    const [inviteCourseId, setInviteCourseId] = useState<number | null>(null);
    const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null);
    const [searchText, setSearchText] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("ALL");
    const [selectedGrade, setSelectedGrade] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState<CourseStatus>("IN_PROGRESS");
    const [showArchived, setShowArchived] = useState(false);
    const [archivedCourses, setArchivedCourses] = useState<Course[]>([]);

    useEffect(() => {
        if (!isManager) return;
        getArchivedCoursesByCenter(centerId)
            .then(setArchivedCourses)
            .catch((error) => console.error("Unable to load archived courses", error));
    }, [centerId, isManager, courses]);

    const handleRestore = async (courseId: number) => {
        try {
            await restoreCourse(courseId);
            toast.success("Course restored.");
            setArchivedCourses((current) => current.filter((course) => course.id !== courseId));
            onUpdate();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Unable to restore course.");
        }
    };

    const statusOptions: CourseStatus[] = ["UPCOMING", "IN_PROGRESS", "ENDED"];

    const subjectOptions = useMemo(() => {
        const unique = new Map<string, string>();
        courses.forEach((course) => {
            if (course.subject?.id != null) {
                unique.set(String(course.subject.id), course.subject.name);
            }
        });
        return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
    }, [courses]);

    const gradeOptions = useMemo(() => {
        const unique = new Map<string, string>();
        courses.forEach((course) => {
            if (course.grade?.id != null) {
                unique.set(String(course.grade.id), course.grade.name);
            }
        });
        return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
    }, [courses]);

    const filteredCourses = useMemo(() => {
        const q = searchText.trim().toLowerCase();

        return courses.filter((course) => {
            const matchesStatus = course.status === statusFilter;
            const teacherFullName = `${course.teacher?.lastName || ""} ${course.teacher?.firstName || ""}`.trim().toLowerCase();
            const courseName = (course.name || "").toLowerCase();
            const matchesSearch =
                q.length === 0 ||
                courseName.includes(q) ||
                teacherFullName.includes(q);

            const matchesSubject =
                selectedSubject === "ALL" ||
                String(course.subject?.id || "") === selectedSubject;

            const matchesGrade =
                selectedGrade === "ALL" ||
                String(course.grade?.id || "") === selectedGrade;

            return matchesStatus && matchesSearch && matchesSubject && matchesGrade;
        });
    }, [courses, searchText, selectedSubject, selectedGrade, statusFilter]);

    const deletingCourse = courses.find((course) => course.id === deletingCourseId);

    return (
        <div className="space-y-4">

            <DeleteCourseOtpModal
                isOpen={deletingCourseId !== null}
                courseId={deletingCourseId}
                courseName={deletingCourse?.name}
                onClose={() => setDeletingCourseId(null)}
                onDeleted={onUpdate}
            />

            {/* HEADER */}
            <div className="flex items-center justify-between rounded-2xl border border-[var(--color-main)]/15 bg-[var(--color-soft-white)] px-5 py-4 shadow-sm">
                <h3 className="font-bold text-[var(--color-text)] flex items-center gap-2">
                    <BookOpen size={18} className="text-[var(--color-main)]" />
                    {isManager ? "Center Courses" : "Courses You Teach"}
                </h3>

                {isManager && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowArchived((value) => !value)}
                            className="flex items-center gap-2 border-2 border-[var(--color-main)] text-[var(--color-main)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-main)] hover:text-white transition"
                        >
                            <ArchiveRestore size={16} />
                            Archived ({archivedCourses.length})
                        </button>
                        <Link
                            href={`/teacher/courses/create?centerId=${centerId}`}
                            className="flex items-center gap-2 bg-[var(--color-main)] border-2 border-[var(--color-main)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-soft-white)] hover:text-[var(--color-main)] transition"
                        >
                            <Plus size={16} />
                            Create Course
                        </Link>
                    </div>
                )}
            </div>

            {showArchived && isManager && (
                <div className="rounded-xl border border-[var(--color-main)]/20 bg-white p-4">
                    <h4 className="mb-3 font-bold text-[var(--color-text)]">Archived Courses</h4>
                    {archivedCourses.length === 0 ? (
                        <p className="text-sm text-gray-500">No archived courses.</p>
                    ) : (
                        <div className="space-y-2">
                            {archivedCourses.map((course) => (
                                <div key={course.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                                    <div>
                                        <Link href={`/teacher/courses/${course.id}`} className="font-semibold text-[var(--color-main)] hover:underline">
                                            {course.name}
                                        </Link>
                                        <p className="text-xs text-gray-500">Finance history remains available.</p>
                                    </div>
                                    <button
                                        onClick={() => handleRestore(course.id)}
                                        className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-main)] px-3 py-2 text-sm font-medium text-[var(--color-main)] transition hover:bg-[var(--color-main)] hover:text-white"
                                    >
                                        <ArchiveRestore size={15} /> Restore
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* CARD LIST */}
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[var(--color-main)]/15 bg-white p-4 md:grid-cols-4">
                <div className="relative md:col-span-2">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Search course or teacher"
                        className="w-full rounded-xl border border-[var(--color-main)]/20 bg-[var(--color-soft-white)] py-3 pl-10 pr-3 outline-none transition focus:border-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-secondary)]/30"
                    />
                </div>

                <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-main)]/20 bg-[var(--color-soft-white)] p-3 outline-none transition focus:border-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-secondary)]/30"
                >
                    <option value="ALL">All Subjects</option>
                    {subjectOptions.map((subject) => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                </select>

                <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-main)]/20 bg-[var(--color-soft-white)] p-3 outline-none transition focus:border-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-secondary)]/30"
                >
                    <option value="ALL">All Grades</option>
                    {gradeOptions.map((grade) => (
                        <option key={grade.id} value={grade.id}>{grade.name}</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--color-main)]/15 bg-[var(--color-soft-white)] p-3">
                {statusOptions.map((status) => {
                    const isActive = statusFilter === status;

                    return (
                        <button
                            key={status}
                            type="button"
                            onClick={() => setStatusFilter(status)}
                            className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition ${
                                isActive
                                    ? "border-[var(--color-main)] bg-[var(--color-main)] text-white"
                                    : "border-[var(--color-main)] bg-[var(--color-soft-white)] text-[var(--color-main)] hover:bg-[var(--color-main)] hover:text-white"
                            }`}
                        >
                            {getCourseStatusLabel(status)}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

                {filteredCourses.length === 0 ? (
                    <div className="col-span-full p-10 text-center text-gray-500 bg-white rounded-xl border">
                        {courses.length === 0
                            ? (isManager
                                ? "No courses created yet."
                                : "You haven't been assigned any courses.")
                            : `No ${getCourseStatusLabel(statusFilter).toLowerCase()} courses match your search/filter.`}
                    </div>
                ) : (
                    filteredCourses.map(course => (

                        <div
                            key={course.id}
                            className="flex min-h-[280px] flex-col overflow-hidden rounded-2xl border border-[var(--color-main)]/20 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                        >

                            {/* ACTIONS */}
                            <div className="flex justify-between items-center gap-2 bg-gradient-to-r from-[var(--color-main)] to-[var(--color-secondary)] p-3">
                                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getCourseStatusClasses(course.status)}`}>
                                    {getCourseStatusLabel(course.status)}
                                </span>

                                <div className="flex items-center gap-2">

                                <Link
                                    href={`/teacher/courses/${course.id}`}
                                    className="p-2 border-2 bg-[var(--color-secondary)] text-white border-[var(--color-secondary)] rounded hover:bg-white hover:text-[var(--color-secondary)] transition"
                                >
                                    <Info size={18} />
                                </Link>

                                {isManager && (
                                    <>
                                        <Link
                                            href={`/teacher/courses/${course.id}/edit`}
                                            className="p-2 border-2 bg-[var(--color-text)] text-white border-[var(--color-text)] rounded hover:bg-white hover:text-[var(--color-text)] transition"
                                        >
                                            <Settings size={18} />
                                        </Link>

                                        <button
                                            onClick={() => {
                                                if (!isCourseEnded(course.status)) {
                                                    return;
                                                }
                                                setDeletingCourseId(course.id);
                                            }}
                                            disabled={!isCourseEnded(course.status)}
                                            title={isCourseEnded(course.status) ? "Archive course" : "Only ended courses can be archived"}
                                            className="p-2 border-2 border-[var(--color-alert)] bg-[var(--color-alert)] text-white rounded hover:bg-[var(--color-soft-white)] hover:text-[var(--color-alert)] transition disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300 disabled:hover:text-gray-500"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </>
                                )}

                                </div>

                            </div>
                            {/* COURSE TITLE */}
                            <div className="flex flex-1 flex-col gap-3 p-5">
                                <h4 className="text-lg font-bold text-[var(--color-text)]">
                                    {course.name}
                                </h4>

                                {/* SUBJECT */}
                                <div className="rounded-xl bg-[var(--color-soft-white)] px-4 py-3 text-sm text-[var(--color-text)]">
                                    <span className="font-medium">Subject:</span>{" "}
                                    {course.subject?.name || "-"}
                                </div>

                                {/* GRADE */}
                                <div>
                                    {course.grade ? (
                                        <span className="px-2 py-1 rounded text-xs bg-[var(--color-secondary)]/10 text-[var(--color-main)] border border-[var(--color-secondary)]/30">
                                            {course.grade.name}
                                            {course.grade.fromAge != null &&
                                                course.grade.toAge != null && (
                                                    <span className="ml-1">
                                                        (age {course.grade.fromAge}-{course.grade.toAge})
                                                    </span>
                                                )}
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 rounded text-xs bg-[var(--color-secondary)]/10 text-[var(--color-main)] border border-[var(--color-secondary)]/30">-</span>
                                    )}
                                </div>

                                {/* TEACHER */}
                                {isManager && (
                                    <div className="rounded-xl bg-[var(--color-soft-white)] px-4 py-3 text-sm">

                                        {course.teacher ? (
                                            <div className="text-[var(--color-text)]">
                                                <span className="font-medium">Teacher:</span>{" "} {course.teacher.lastName} {course.teacher.firstName}
                                            </div>
                                        ) : (
                                            <div className="text-gray-400 italic">
                                                Not assigned
                                            </div>
                                        )}

                                        {course.invitationStatus === "PENDING" && (
                                            <div className="text-xs text-[var(--color-alert)] italic">
                                                Pending invitation
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setInviteCourseId(course.id)}
                                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-main)] transition hover:underline"
                                        >
                                            <Mail size={12} />
                                            Change Teacher
                                        </button>

                                    </div>
                                )}
                            </div>



                        </div>

                    ))
                )}

            </div>

            {/* CHANGE TEACHER MODAL */}
            {isManager && (
                <InviteTeacherModal
                    courseId={inviteCourseId}
                    centerId={centerId}
                    isOpen={inviteCourseId !== null}
                    onClose={() => setInviteCourseId(null)}
                    onSuccess={onUpdate}
                />
            )}

        </div>

    );
}
