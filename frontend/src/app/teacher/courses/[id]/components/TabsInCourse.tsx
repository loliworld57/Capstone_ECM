"use client";

import { BookOpen, Users, UserCog, Book, NotebookPen, ClipboardCheck, WalletCards } from "lucide-react";
import { useRef, useEffect } from "react";
import SimpleBar from "simplebar-react";

interface Props {
    activeTab: string;
    setActiveTab: (tab: "General Info" | "Students" | "Materials" | "Attendance" | "Enrollment" | "Assignments" | "Gradebook" | "Quiz" | "Finance") => void;
    isManager: boolean;
    courseId: number;
}

export default function TabsInCourse({ activeTab, setActiveTab, isManager, courseId }: Props) {
    const simpleBarRef = useRef<any>(null);

    const tabStyle = (tab: string) =>
        `shrink-0 px-4 py-2.5 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all duration-200
    ${activeTab === tab
            ? "border-[var(--color-main)] text-[var(--color-main)] bg-[var(--color-main)]/[0.02]"
            : "border-transparent text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:border-[var(--color-text)]/20"
        }`;

    // Safely trap the wheel event using a non-passive native listener
    useEffect(() => {
        const scrollElement = simpleBarRef.current?.getScrollElement();
        if (!scrollElement) return;

        const handleWheel = (e: WheelEvent) => {
            // Check if horizontal scroll capacity exists to avoid trapping the scroll unnecessarily
            const canScrollLeft = scrollElement.scrollLeft > 0;
            const canScrollRight = scrollElement.scrollLeft < (scrollElement.scrollWidth - scrollElement.clientWidth);

            // If there's scrollable room horizontally, redirect vertical wheel input to horizontal movement
            if ((e.deltaY > 0 && canScrollRight) || (e.deltaY < 0 && canScrollLeft)) {
                e.preventDefault(); // Safely blocks the background page from scrolling
                scrollElement.scrollLeft += e.deltaY;
            }
        };

        // Adding passive: false allows e.preventDefault() to function as expected
        scrollElement.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            scrollElement.removeEventListener("wheel", handleWheel);
        };
    }, []);

    return (
        <SimpleBar
            ref={simpleBarRef}
            className="tabs-scroll w-full pb-1"
            autoHide={false}
            forceVisible="x"
        >
            <div className="flex w-max gap-2 border-b border-[var(--color-text)]/10 whitespace-nowrap px-1">
                {/* GENERAL INFO */}
                <button
                    onClick={() => setActiveTab("General Info")}
                    className={tabStyle("General Info")}
                >
                    <BookOpen size={16} className="stroke-[2.5]" />
                    General Info
                </button>

                {/* STUDENTS */}
                <button
                    onClick={() => setActiveTab("Students")}
                    className={tabStyle("Students")}
                >
                    <Users size={16} className="stroke-[2.5]" />
                    Students
                </button>

                {/* MATERIALS */}
                <button
                    onClick={() => setActiveTab("Materials")}
                    className={tabStyle("Materials")}
                >
                    <Book size={16} className="stroke-[2.5]" />
                    Materials
                </button>

                {/* ASSIGNMENTS */}
                <button
                    onClick={() => setActiveTab("Assignments")}
                    className={tabStyle("Assignments")}
                >
                    <NotebookPen size={16} className="stroke-[2.5]" />
                    Assignments
                </button>

                {/* GRADEBOOK */}
                <button
                    onClick={() => setActiveTab("Gradebook")}
                    className={tabStyle("Gradebook")}
                >
                    <ClipboardCheck size={16} className="stroke-[2.5]" />
                    Gradebook
                </button>

                {/* ATTENDANCE */}
                <button
                    onClick={() => setActiveTab("Attendance")}
                    className={tabStyle("Attendance")}
                >
                    <ClipboardCheck size={16} className="stroke-[2.5]" />
                    Attendance
                </button>

                {/* QUIZ */}
                <button
                    onClick={() => setActiveTab("Quiz")}
                    className={tabStyle("Quiz")}
                >
                    <ClipboardCheck size={16} className="stroke-[2.5]" />
                    Quiz
                </button>

                {/* ENROLLMENT (Manager only) */}
                {isManager && (
                    <button
                        onClick={() => setActiveTab("Enrollment")}
                        className={tabStyle("Enrollment")}
                    >
                        <UserCog size={16} className="stroke-[2.5]" />
                        Enrollment
                    </button>
                )}

                {/* FINANCE (Manager only) */}
                {isManager && (
                    <button
                        onClick={() => setActiveTab("Finance")}
                        className={tabStyle("Finance")}
                    >
                        <WalletCards size={16} className="stroke-[2.5]" />
                        Finance
                    </button>
                )}
            </div>
        </SimpleBar>
    );
}