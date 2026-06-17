"use client";

import { 
    BookOpen, 
    Book, 
    NotebookPen, 
    ClipboardCheck, 
    CalendarCheck, 
    WalletCards,
    LucideIcon 
} from "lucide-react";
import { useEffect, useRef, useMemo } from "react";
import SimpleBar from "simplebar-react";

type TabKey = "General Info" | "Materials" | "Attendance" | "Assignments" | "Quizzes" | "Finance";

interface Props {
    activeTab: TabKey;
    setActiveTab: (tab: TabKey) => void;
    isManager: boolean;
}

interface TabConfig {
    key: TabKey;
    label: string;
    icon: LucideIcon;
    managerOnly?: boolean;
}

export default function TabsInCourse({ activeTab, setActiveTab, isManager }: Props) {
    const simpleBarRef = useRef<any>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Centralized tab items mapping configurations array
    const courseTabs = useMemo<TabConfig[]>(() => [
        { key: "General Info", label: "General Info", icon: BookOpen },
        { key: "Materials", label: "Materials", icon: Book },
        { key: "Assignments", label: "Assignments", icon: NotebookPen },
        { key: "Quizzes", label: "Quizzes", icon: ClipboardCheck },
        { key: "Attendance", label: "Attendance", icon: CalendarCheck },
        { key: "Finance", label: "Finance", icon: WalletCards},
    ], []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Native DOM scroll interceptor mapping vertical scroll direct into horizontal offsets
        const handleNativeWheel = (e: WheelEvent) => {
            const scrollElement = simpleBarRef.current?.getScrollElement();

            if (scrollElement) {
                const isScrollable = scrollElement.scrollWidth > scrollElement.clientWidth;
                
                if (isScrollable) {
                    e.preventDefault();
                    e.stopPropagation(); 
                    scrollElement.scrollLeft += e.deltaY;
                }
            }
        };

        container.addEventListener("wheel", handleNativeWheel, { passive: false });

        return () => {
            container.removeEventListener("wheel", handleNativeWheel);
        };
    }, []);

    // Styled matching theme tokens dynamically 
    const tabStyle = (tab: TabKey) =>
        `shrink-0 px-4 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all duration-200 outline-none select-none rounded-t-lg tracking-tight
        ${activeTab === tab
            ? "border-[var(--color-main)] text-[var(--color-main)] bg-[var(--color-secondary)]/10"
            : "border-transparent text-gray-500 hover:text-[var(--color-text)] hover:bg-gray-100/60"
        }`;

    return (
        <div ref={scrollContainerRef} className="w-full overflow-hidden">
            <SimpleBar
                ref={simpleBarRef}
                className="tabs-scroll w-full"
                autoHide={true}
                forceVisible="x"
            >
                <div className="flex w-max gap-1.5 border-b border-gray-200 whitespace-nowrap px-1">
                    {courseTabs.map((tab) => {
                        // Protect visibility logic loops from regular client states
                        if (tab.managerOnly && !isManager) return null;

                        const IconComponent = tab.icon;

                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={tabStyle(tab.key)}
                            >
                                <IconComponent size={16} className="stroke-[2.2]" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </SimpleBar>
        </div>
    );
}