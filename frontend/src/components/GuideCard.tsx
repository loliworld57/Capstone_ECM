"use client";

import React from "react";

type GuideCardProps = {
  step: number;
  title: string;
  icon: React.ReactNode;
  description: React.ReactNode;
};

export default function GuideCard({
  step,
  title,
  icon,
  description,
}: GuideCardProps) {
  return (
    <div
      className="
        overflow-hidden
        rounded-3xl
        bg-white
        shadow-xl
        border border-gray-100
      "
    >
      {/* Injecting custom keyframes directly into a hidden style block so you don't break globals.css */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes soft-shake {
          0%, 100% { transform: rotate(-2deg) translateX(0); }
          25% { transform: rotate(3deg) translateX(4px); }
          50% { transform: rotate(-3deg) translateX(-4px); }
          75% { transform: rotate(2deg) translateX(2px); }
        }
        .animate-soft-shake {
          animation: soft-shake 3s ease-in-out infinite;
        }
      `}} />

      <div className="grid md:grid-cols-2 min-h-[420px]">
        
        {/* Icon Illustration Container */}
        <div className="relative bg-gradient-to-br from-[var(--color-soft-white)] to-blue-50/40 flex items-center justify-center p-8 min-h-[260px] md:min-h-full">
          {/* Decorative geometric background rings */}
          <div className="absolute w-64 h-64 rounded-full bg-[var(--color-main)]/5 blur-xl animate-pulse" />
          <div className="absolute w-40 h-40 rounded-full border border-[var(--color-secondary)]/20 scale-110" />
          
          {/* Main Icon Frame with infinite wobble rotation applied */}
          <div className="relative z-10 p-8 bg-white rounded-2xl shadow-md border border-gray-100/50 flex items-center justify-center animate-soft-shake hover:pause">
            {React.isValidElement(icon)
              ? React.cloneElement(icon as React.ReactElement<any>, {
                  className: "w-20 h-20 text-[var(--color-main)]",
                })
              : icon}
          </div>
        </div>

        {/* Content Side */}
        <div className="flex flex-col justify-center p-8 md:p-12">
          <span
            className="
              w-fit
              rounded-full
              bg-[var(--color-main)]/10
              px-4
              py-2
              text-sm
              font-semibold
              text-[var(--color-main)]
            "
          >
            STEP {step}
          </span>

          <h3 className="mt-4 text-3xl font-bold text-[var(--color-text)]">
            {title}
          </h3>

          <div className="mt-6 text-gray-600 leading-relaxed">
            {description}
          </div>
        </div>

      </div>
    </div>
  );
}