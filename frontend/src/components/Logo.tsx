"use client";

import React from "react";

type LogoProps = {
  className?: string;
  color?: string;
};

export default function Logo({ className = "", color }: LogoProps) {
  // Use the brand color from variables if not explicitly provided
  const logoColor = color || "var(--color-main, #4f46e5)";

  return (
    <div className={`flex items-center gap-3 shrink-0 ${className}`}>
      {/* 1. Integrated Glyph: Cap + Growth Chart */}
      <svg
        width="36"
        height="32"
        viewBox="0 0 36 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        {/* Main Cap Structure */}
        <path
          d="M18 1L1 9.5V13.5L18 22L35 13.5V9.5L18 1Z"
          fill={logoColor}
        />
        {/* Cap Tassel (Slightly darker for depth) */}
        <path
          d="M33 11.5V19.5"
          stroke={logoColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Integrated Growth Bars (Using Negative Space) */}
        <rect x="7" y="25" width="4" height="6" rx="1" fill="white" />
        <rect x="13" y="21" width="4" height="10" rx="1" fill="white" />
        <rect x="19" y="17" width="4" height="14" rx="1" fill="white" />
        <rect x="25" y="13" width="4" height="18" rx="1" fill="white" />
      </svg>

      {/* 2. Unified Brand Typography */}
      <div className="flex flex-col leading-none">
        <span
          className="text-2xl font-black tracking-tighter text-gray-950 transition-colors"
          style={{ color }}
        >
          ECM
        </span>
        <span
          className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-0.5"
        >
          Management
        </span>
      </div>
    </div>
  );
}