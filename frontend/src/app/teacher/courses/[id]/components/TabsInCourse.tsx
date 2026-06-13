import { BookOpen, Users, UserCog, Book, NotebookPen, ClipboardCheck, WalletCards } from "lucide-react";
import { useRef } from "react";
import SimpleBar from "simplebar-react";

interface Props {
    activeTab: string;
    setActiveTab: (tab: "General Info" | "Students" | "Materials" | "Attendance" | "Enrollment" | "Assignments" | "Gradebook" | "Quiz" | "Finance") => void;
    isManager: boolean;
    courseId: number;
}

export default function TabsInCourse({ activeTab, setActiveTab, isManager, courseId }: Props) {
    const tabStyle = (tab: string) =>
        `shrink-0 px-4 py-2 font-medium flex items-center gap-2 border-b-4 border-r-2 transition
    ${activeTab === tab
            ? "border-[var(--color-main)] text-[var(--color-main)]"
            : "border-transparent text-[var(--color-text)] hover:text-[var(--color-secondary)]"
        }`;
    const simpleBarRef = useRef<any>(null);
    return (

        <SimpleBar
            ref={simpleBarRef}
            className="tabs-scroll w-full pb-2"
            autoHide={false}
            forceVisible="x"
            onWheel={(e) => {
                e.preventDefault();

                const scrollElement =
                    simpleBarRef.current?.getScrollElement();

                if (scrollElement) {
                    scrollElement.scrollLeft += e.deltaY;
                }
            }}
        >

            <div className="flex w-max gap-6 border-b border-[var(--color-text)] whitespace-nowrap">
                {/* GENERAL INFO */}
                <button
                    onClick={() => setActiveTab("General Info")}
                    className={tabStyle("General Info")}
                >
                    <BookOpen size={18} />
                    General Info
                </button>

                {/* STUDENTS */}
                <button
                    onClick={() => setActiveTab("Students")}
                    className={tabStyle("Students")}
                >
                    <Users size={18} />
                    Students
                </button>

                {/* MATERIALS */}
                <button
                    onClick={() => setActiveTab("Materials")}
                    className={tabStyle("Materials")}
                >
                    <Book size={18} />
                    Materials
                </button>

                {/* ASSIGNMENTS */}
                <button
                    onClick={() => setActiveTab("Assignments")}
                    className={tabStyle("Assignments")}
                >
                    <NotebookPen size={18} />
                    Assignments
                </button>

                <button
                    onClick={() => setActiveTab("Gradebook")}
                    className={tabStyle("Gradebook")}
                >
                    <ClipboardCheck size={18} />
                    Gradebook
                </button>

                <button
                    onClick={() => setActiveTab("Attendance")}
                    className={tabStyle("Attendance")}
                >
                    <ClipboardCheck size={18} />
                    Attendance
                </button>

                <button
                    onClick={() => setActiveTab("Quiz")}
                    className={tabStyle("Quiz")}
                >
                    <ClipboardCheck size={18} />
                    Quiz
                </button>

                {/* ENROLLMENT (Manager only) */}
                {isManager && (
                    <button
                        onClick={() => setActiveTab("Enrollment")}
                        className={tabStyle("Enrollment")}
                    >
                        <UserCog size={18} />
                        Enrollment
                    </button>
                )}

                {isManager && (
                    <button
                        onClick={() => setActiveTab("Finance")}
                        className={tabStyle("Finance")}
                    >
                        <WalletCards size={18} />
                        Finance
                    </button>
                )}

            </div>
        </SimpleBar>
    );
}
