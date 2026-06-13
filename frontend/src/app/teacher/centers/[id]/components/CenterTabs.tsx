import {
    BookOpen,
    Building2,
    Users,
    UserCog,
    BookA,
    BookPlus,
    CalendarDays,
    WalletCards,
} from "lucide-react";
import { Dispatch, SetStateAction, useRef } from "react";
import SimpleBar from "simplebar-react";

type TabKey =
    | "courses"
    | "students"
    | "teachers"
    | "subjects"
    | "grades"
    | "classrooms"
    | "class-slots"
    | "finance";

interface Props {
    activeTab: TabKey;
    setActiveTab: Dispatch<SetStateAction<TabKey>>;
    isManager: boolean;
}

export default function CenterTabs({
    activeTab,
    setActiveTab,
    isManager,
}: Props) {
    const simpleBarRef = useRef<any>(null);

    const tabStyle = (tab: TabKey) =>
        `shrink-0 px-4 py-2 font-medium flex items-center gap-2 border-b-4 border-r-2 transition
        ${activeTab === tab
            ? "border-[var(--color-main)] text-[var(--color-main)]"
            : "border-transparent text-[var(--color-text)] hover:text-[var(--color-secondary)]"
        }`;

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
                <button
                    onClick={() => setActiveTab("courses")}
                    className={tabStyle("courses")}
                >
                    <BookOpen size={18} />
                    Courses
                </button>

                <button
                    onClick={() => setActiveTab("students")}
                    className={tabStyle("students")}
                >
                    <Users size={18} />
                    Students
                </button>

                {isManager && (
                    <>
                        <button
                            onClick={() => setActiveTab("subjects")}
                            className={tabStyle("subjects")}
                        >
                            <BookA size={18} />
                            Subjects
                        </button>

                        <button
                            onClick={() => setActiveTab("grades")}
                            className={tabStyle("grades")}
                        >
                            <BookPlus size={18} />
                            Grades
                        </button>

                        <button
                            onClick={() => setActiveTab("classrooms")}
                            className={tabStyle("classrooms")}
                        >
                            <Building2 size={18} />
                            Classrooms
                        </button>

                        <button
                            onClick={() => setActiveTab("class-slots")}
                            className={tabStyle("class-slots")}
                        >
                            <CalendarDays size={18} />
                            Timeline
                        </button>

                        <button
                            onClick={() => setActiveTab("teachers")}
                            className={tabStyle("teachers")}
                        >
                            <UserCog size={18} />
                            Teachers
                        </button>

                        <button
                            onClick={() => setActiveTab("finance")}
                            className={tabStyle("finance")}
                        >
                            <WalletCards size={18} />
                            Finance
                        </button>
                    </>
                )}
            </div>
        </SimpleBar>
    );
}