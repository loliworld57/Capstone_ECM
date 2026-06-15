"use client";

import React from "react";

type FeatureCardProps = {
  title: string;
  icon: React.ReactNode;
  description: string | React.ReactNode;
};

export default function FeatureCard({ title, icon, description }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5 shadow-xs hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300 group">
      
      {/* Top row containing Icon and Title Badge together */}
      <div className="flex items-center gap-4">
        {/* Dynamic Icon Container */}
        <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 transition-all duration-300 shrink-0">
          {React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement<any>, {
                className: "w-6 h-6 stroke-[2]",
              })
            : icon}
        </div>

        {/* Structured Header Title */}
        <h3 className="text-lg font-bold text-gray-950 tracking-tight transition-colors duration-200">
          {title}
        </h3>
      </div>

      {/* Decorative separating line */}
      <div className="h-[1px] w-full bg-linear-to-r from-gray-100 to-transparent" />

      {/* Main Content Area */}
      <div className="text-sm text-gray-600 leading-relaxed flex-1">
        {description}
      </div>
    </div>
  );
}