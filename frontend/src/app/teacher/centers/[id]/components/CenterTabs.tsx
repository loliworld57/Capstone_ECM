import { BookOpen, Building2, Users, UserCog, BookA, BookPlus, CalendarDays, WalletCards } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

type TabKey = "courses" | "students" | "teachers" | "subjects" | "grades" | "classrooms" | "class-slots" | "finance";

interface Props {
    activeTab: TabKey;
    setActiveTab: Dispatch<SetStateAction<TabKey>>;
    isManager: boolean;
}

export default function CenterTabs({ activeTab, setActiveTab, isManager }: Props) {
    return (
        <div className="overflow-x-auto border-b border-[var(--color-text)]">
            <div className="flex min-w-max gap-2 sm:gap-4">
                <button
                    onClick={() => setActiveTab("courses")}
                    className={`shrink-0 whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium flex items-center gap-2 border-b-4 border-r-2 transition sm:px-4 sm:text-base
        ${activeTab === "courses"
                        ? "border-[var(--color-main)] text-[var(--color-main)]"
                        : "border-transparent text-[var(--color-text)] hover:text-[var(--color-secondary)]"
                    }`}
                >
                    <BookOpen size={18} /> Courses
                </button>

                <button
                    onClick={() => setActiveTab("students")}
                    className={`shrink-0 whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium flex items-center gap-2 border-b-4 border-r-2 transition sm:px-4 sm:text-base
        ${activeTab === "students"
                        ? "border-[var(--color-main)] text-[var(--color-main)]"
                        : "border-transparent text-[var(--color-text)] hover:text-[var(--color-secondary)]"
                    }`}
                >
                    <Users size={18} /> Students
                </button>

                {isManager && (
                    <>
                        <button
                            onClick={() => setActiveTab("subjects")}
                            className={`shrink-0 whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium flex items-center gap-2 border-b-4 border-r-2 transition sm:px-4 sm:text-base
                        ${activeTab === "subjects"
                                ? "border-[var(--color-main)] text-[var(--color-main)]"
                                : "border-transparent text-[var(--color-text)] hover:text-[var(--color-secondary)]"
                            }`}
                        >
                            <BookA size={18} /> Subjects
                        </button>

                        <button
                            onClick={() => setActiveTab("grades")}
                            className={`shrink-0 whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium flex items-center gap-2 border-b-4 border-r-2 transition sm:px-4 sm:text-base
                        ${activeTab === "grades"
                                ? "border-[var(--color-main)] text-[var(--color-main)]"
                                : "border-transparent text-[var(--color-text)] hover:text-[var(--color-secondary)]"
                            }`}
                        >
                            <BookPlus size={18} /> Grades
                        </button>

                        <button
                            onClick={() => setActiveTab("classrooms")}
                            className={`shrink-0 whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium flex items-center gap-2 border-b-4 border-r-2 transition sm:px-4 sm:text-base
                        ${activeTab === "classrooms"
                                ? "border-[var(--color-main)] text-[var(--color-main)]"
                                : "border-transparent text-[var(--color-text)] hover:text-[var(--color-secondary)]"
                            }`}
                        >
                            <Building2 size={18} /> Classrooms
                        </button>

                        <button
                            onClick={() => setActiveTab("class-slots")}
                            className={`shrink-0 whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium flex items-center gap-2 border-b-4 border-r-2 transition sm:px-4 sm:text-base
                        ${activeTab === "class-slots"
                                ? "border-[var(--color-main)] text-[var(--color-main)]"
                                : "border-transparent text-[var(--color-text)] hover:text-[var(--color-secondary)]"
                            }`}
                        >
                            <CalendarDays size={18} /> Timeline
                        </button>

                        <button
                            onClick={() => setActiveTab("teachers")}
                            className={`shrink-0 whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium flex items-center gap-2 border-b-4 border-r-2 transition sm:px-4 sm:text-base
                        ${activeTab === "teachers"
                                ? "border-[var(--color-main)] text-[var(--color-main)]"
                                : "border-transparent text-[var(--color-text)] hover:text-[var(--color-secondary)]"
                            }`}
                        >
                            <UserCog size={18} /> Teachers
                        </button>

                        <button
                            onClick={() => setActiveTab("finance")}
                            className={`shrink-0 whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium flex items-center gap-2 border-b-4 border-r-2 transition sm:px-4 sm:text-base
                        ${activeTab === "finance"
                                ? "border-[var(--color-main)] text-[var(--color-main)]"
                                : "border-transparent text-[var(--color-text)] hover:text-[var(--color-secondary)]"
                            }`}
                        >
                            <WalletCards size={18} /> Finance
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
