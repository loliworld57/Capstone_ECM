import { BookOpen, Book, NotebookPen, ClipboardCheck, WalletCards } from "lucide-react";

interface Props {
    activeTab: string;
    setActiveTab: (tab: "General Info" | "Materials" | "Attendance" | "Assignments" | "Quizzes" | "Finance") => void;
    isManager: boolean;
}

export default function TabsInCourse({ activeTab, setActiveTab, isManager }: Props) {

    const tabStyle = (tab: string) =>
        `px-4 py-2 font-medium flex items-center gap-2 border-b-4 border-r-2 transition
        ${activeTab === tab
            ? "border-[var(--color-main)] text-[var(--color-main)]"
            : "border-transparent text-[var(--color-text)] hover:text-[var(--color-secondary)]"
        }`;

    return (
        <div className="flex border-b border-[var(--color-text)] gap-6">

            {/* GENERAL INFO */}
            <button
                onClick={() => setActiveTab("General Info")}
                className={tabStyle("General Info")}
            >
                <BookOpen size={18} />
                General Info
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

            {/* QUIZZES */}
            <button
                onClick={() => setActiveTab("Quizzes")}
                className={tabStyle("Quizzes")}
            >
                <ClipboardCheck size={18} />
                Quizzes
            </button>

            {/* ATTENDANCE */}
            <button
                onClick={() => setActiveTab("Attendance")}
                className={tabStyle("Attendance")}
            >
                <ClipboardCheck size={18} />
                Attendance
            </button>
            {/* FINANCE */}
            <button
                onClick={() => setActiveTab("Finance")}
                className={tabStyle("Finance")}
            >
                <WalletCards size={18} />
                Finance
            </button>

        </div>
    );
}
