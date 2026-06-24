"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Users,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getRoleName, getStoredUser } from "@/utils/auth";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [collapsed, setCollapsed] = useState(false);

    // Đã đồng bộ tracking breakpoint giống hệ thống Teacher Layout (FHD và các màn hình nhỏ hơn)
    const [isFHDAndAbove, setIsFHDAndAbove] = useState(true);
    const sidebarRef = useRef<HTMLElement | null>(null);

    // Kiểm tra quyền hạn và xác thực người dùng
    useEffect(() => {
        const storedUser = getStoredUser();

        if (!storedUser) {
            router.push("/login");
            return;
        }

        const roleName = getRoleName(storedUser.role);
        if (roleName !== "ADMIN") {
            router.replace("/AccessDenied");
            return;
        }

        setUser(storedUser);
    }, [router]);

    // Đồng bộ xử lý Responsive Breakpoints
    useEffect(() => {
        const fhdQuery = window.matchMedia("(min-width: 1920px)");

        const handleResizeUpdate = () => {
            const matchesFHD = fhdQuery.matches;
            setIsFHDAndAbove(matchesFHD);

            // Mặc định: Giữ mở rộng cố định trên màn FHD+, tự động thu gọn/ẩn trên màn hình nhỏ hơn
            if (matchesFHD) {
                setCollapsed(false);
            } else {
                setCollapsed(true);
            }
        };

        handleResizeUpdate();
        fhdQuery.addEventListener("change", handleResizeUpdate);

        return () => {
            fhdQuery.removeEventListener("change", handleResizeUpdate);
        };
    }, []);

    // Đóng Sidebar Drawer khi click ra vùng ngoài (Áp dụng cho các màn hình dưới FHD)
    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (isFHDAndAbove || collapsed) return;

            const target = event.target as Node | null;
            if (!target) return;
            if (sidebarRef.current?.contains(target)) return;

            setCollapsed(true);
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
        };
    }, [collapsed, isFHDAndAbove]);

    // Tự động đóng popup menu panel sau khi thay đổi route điều hướng (Dưới FHD)
    useEffect(() => {
        if (!isFHDAndAbove) {
            setCollapsed(true);
        }
    }, [pathname, isFHDAndAbove]);

    // Giữ nguyên Menu Item cấu hình gốc của Admin
    const menuItems = [
        { name: "Users", href: "/admin/users", icon: Users },
    ];

    return (
        <div className="relative min-h-screen w-full bg-[var(--color-soft-white)] text-slate-900 selection:bg-indigo-500 selection:text-white flex flex-col">

            {/* NÚT MŨI TÊN NỔI (FLOATING TRIGGER) - Xuất hiện khi Sidebar thu gọn hoàn toàn */}
            {collapsed && (
                <button
                    onClick={() => setCollapsed(false)}
                    className="fixed z-40 flex items-center justify-center p-2.5 rounded-r-xl border-y border-r border-slate-800 text-slate-400 bg-slate-950/80 backdrop-blur-sm opacity-60 hover:opacity-100 transition-all active:scale-95 shadow-xl animate-fade-in"
                    style={{ top: "calc(var(--app-header-height, 73px) + 20px)" }}
                    aria-label="Reveal workspace menu panel"
                >
                    <ChevronRight size={18} className="stroke-[3]" />
                </button>
            )}

            {/* THANH ĐIỀU HƯỚNG BÊN (SIDEBAR NAV) ĐÃ ĐỒNG BỘ STYLE CỦA TEACHER */}
            <aside
                ref={sidebarRef}
                className={`fixed left-0 z-50 flex flex-col border-r border-slate-900 bg-slate-950 shadow-2xl transition-all duration-300 ease-in-out ${isFHDAndAbove
                        ? collapsed
                            ? "translate-x-0 w-20" // Giao diện Mini-strip rút gọn trên màn hình lớn FHD+
                            : "translate-x-0 w-64" // Giao diện mở rộng đầy đủ 
                        : collapsed
                            ? "-translate-x-full w-64 pointer-events-none opacity-0" // Ẩn hoàn toàn khỏi màn hình nếu dưới FHD
                            : "translate-x-0 w-64 opacity-100" // Hiện dạng Drawer Overlay đè lên nội dung
                    }`}
                style={{
                    top: "var(--app-header-height, 73px)",
                    height: "calc(100vh - var(--app-header-height, 73px))"
                }}
            >
                {/* Header Thông Tin Bản Thân Tài Khoản Admin */}
                <div className={`flex items-center p-4 border-b border-slate-900 min-h-[73px] transition-all ${(isFHDAndAbove && collapsed) ? "justify-center" : "justify-between"
                    }`}>
                    <div className={`truncate pr-2 transition-all duration-300 ${(isFHDAndAbove && collapsed) ? "w-0 opacity-0 pointer-events-none hidden" : "w-auto opacity-100 block"
                        }`}>
                        <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase">System Control</h2>
                        <p className="text-sm font-bold text-white truncate mt-0.5">
                            {user?.firstName ? `Admin: ${user.firstName}` : "Administrator"}
                        </p>
                    </div>

                    {/* Nút đóng/mở layout chủ động */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`p-2 rounded-xl border border-slate-800 text-slate-400 bg-slate-900/50 hover:bg-slate-900 hover:text-white hover:border-slate-700 transition-all active:scale-95 shadow-md ${!isFHDAndAbove && collapsed ? "hidden" : "block"
                            }`}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {(isFHDAndAbove && collapsed) ? <ChevronRight size={16} className="stroke-[2.5]" /> : <ChevronLeft size={16} className="stroke-[2.5]" />}
                    </button>
                </div>

                {/* Danh Sách Các Menu Items Hệ Thống */}
                <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        const isMiniStrip = isFHDAndAbove && collapsed;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group relative flex items-center rounded-xl p-3 text-sm font-semibold transition-all duration-200 outline-none ${isActive
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 border border-indigo-500/50"
                                        : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-100 border border-transparent"
                                    } ${isMiniStrip ? "justify-center" : "gap-3.5"}`}
                            >
                                <item.icon
                                    size={20}
                                    className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-white stroke-[2.5]" : "text-slate-400 group-hover:text-slate-200 stroke-[2]"
                                        }`}
                                />

                                {/* Nhãn chữ ẩn/hiện mượt mà */}
                                <span className={`tracking-wide whitespace-nowrap transition-all duration-200 origin-left ${isMiniStrip
                                        ? "w-0 opacity-0 pointer-events-none hidden"
                                        : "w-auto opacity-100 block"
                                    }`}>
                                    {item.name}
                                </span>

                                {/* Pure CSS Tooltips hiển thị khi hover trên giao diện thu gọn mini-strip */}
                                {isMiniStrip && (
                                    <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-200 text-xs font-medium rounded-lg opacity-0 invisible translate-x-[-8px] group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap pointer-events-none shadow-xl z-50">
                                        {item.name}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* LỚP NỀN MỜ BACKDROP COV - Xuất hiện dưới màn hình FHD khi menu được kéo ra */}
            {!collapsed && !isFHDAndAbove && (
                <div
                    className="fixed left-0 w-screen z-30 bg-slate-950/20 backdrop-blur-[1px] transition-all duration-300"
                    onClick={() => setCollapsed(true)}
                    style={{
                        top: "var(--app-header-height, 73px)",
                        height: "calc(100vh - var(--app-header-height, 73px))"
                    }}
                />
            )}

            {/* KHU VỰC CHỨA NỘI DUNG CHÍNH (CONTENT ENGINE LAYER) */}
            <main className="w-full min-h-[calc(100vh-var(--app-header-height,73px))] flex flex-col justify-between z-0 relative">
                <div className="container mx-auto px-4 py-6 sm:px-8 bg-[var(--color-soft-white)] sm:py-8 max-w-7xl animate-fade-in flex-1">
                    <div className="min-h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}