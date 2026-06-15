"use client";

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
import { Dispatch, SetStateAction, useEffect, useRef } from "react";
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

    // Using a separate element ref to explicitly bind non-passive native events
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Native DOM event handler with strict execution overrides
        const handleNativeWheel = (e: WheelEvent) => {
            const scrollElement = simpleBarRef.current?.getScrollElement();

            if (scrollElement) {
                const isScrollable = scrollElement.scrollWidth > scrollElement.clientWidth;
                
                if (isScrollable) {
                    // Forcefully stops window vertical displacement
                    e.preventDefault();
                    // Halts standard bubble sequence
                    e.stopPropagation(); 
                    
                    // Maps vertical index ticks directly to horizontal offset values
                    scrollElement.scrollLeft += e.deltaY;
                }
            }
        };

        // CRITICAL FIX: { passive: false } overrides modern browser scrolling defaults
        container.addEventListener("wheel", handleNativeWheel, { passive: false });

        return () => {
            container.removeEventListener("wheel", handleNativeWheel);
        };
    }, []);

    // REFACtORED TO USE STYLESHEET CSS VARIABLES
    const tabStyle = (tab: TabKey) =>
        `shrink-0 px-4 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all duration-200 outline-none select-none rounded-t-lg tracking-tight
        ${activeTab === tab
            ? "border-[var(--color-main)] text-[var(--color-main)] bg-[var(--color-secondary)]/10"
            : "border-transparent text-gray-500 hover:text-[var(--color-text)] hover:bg-gray-100/60"
        }`;

    return (
        // Wrapped SimpleBar inside a targeted container to track raw hover/wheel interaction points cleanly
        <div ref={scrollContainerRef} className="w-full overflow-hidden">
            <SimpleBar
                ref={simpleBarRef}
                className="tabs-scroll w-full"
                autoHide={true}
                forceVisible="x"
            >
                <div className="flex w-max gap-1.5 border-b border-gray-200 whitespace-nowrap px-1">
                    <button
                        onClick={() => setActiveTab("courses")}
                        className={tabStyle("courses")}
                    >
                        <BookOpen size={16} className="stroke-[2.2]" />
                        <span>Courses</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("students")}
                        className={tabStyle("students")}
                    >
                        <Users size={16} className="stroke-[2.2]" />
                        <span>Students</span>
                    </button>

                    {isManager && (
                        <>
                            <button
                                onClick={() => setActiveTab("subjects")}
                                className={tabStyle("subjects")}
                            >
                                <BookA size={16} className="stroke-[2.2]" />
                                <span>Subjects</span>
                            </button>

                            <button
                                onClick={() => setActiveTab("grades")}
                                className={tabStyle("grades")}
                            >
                                <BookPlus size={16} className="stroke-[2.2]" />
                                <span>Grades</span>
                            </button>

                            <button
                                onClick={() => setActiveTab("classrooms")}
                                className={tabStyle("classrooms")}
                            >
                                <Building2 size={16} className="stroke-[2.2]" />
                                <span>Classrooms</span>
                            </button>

                            <button
                                onClick={() => setActiveTab("class-slots")}
                                className={tabStyle("class-slots")}
                            >
                                <CalendarDays size={16} className="stroke-[2.2]" />
                                <span>Timeline</span>
                            </button>

                            <button
                                onClick={() => setActiveTab("teachers")}
                                className={tabStyle("teachers")}
                            >
                                <UserCog size={16} className="stroke-[2.2]" />
                                <span>Teachers</span>
                            </button>

                            <button
                                onClick={() => setActiveTab("finance")}
                                className={tabStyle("finance")}
                            >
                                <WalletCards size={16} className="stroke-[2.2]" />
                                <span>Finance</span>
                            </button>
                        </>
                    )}
                </div>
            </SimpleBar>
        </div>
    );
}