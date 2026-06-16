"use client";

import React from "react";
import { Mail, GraduationCap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-slate-950/90 border-t border-slate-900/40 backdrop-blur-md transition-colors duration-300">
      <div className="container mx-auto px-6 py-10">
        
        {/* Core Informational Split Grid */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-slate-800/50">
          
          {/* Left Block: Team / Domain Contact Matrix */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Mail size={12} className="text-indigo-400" /> Contact the Team
            </h4>
            <div className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
              <a 
                href="mailto:tung.le.cit20@eiu.edu.vn" 
                className="hover:text-indigo-400 transition-colors duration-150"
              >
                tung.le.cit20@eiu.edu.vn
              </a>
              <a 
                href="mailto:anh.doviet.cit21@eiu.edu.vn" 
                className="hover:text-indigo-400 transition-colors duration-150"
              >
                anh.doviet.cit21@eiu.edu.vn
              </a>
            </div>
          </div>

          {/* Right Block: Project Classification Badge */}
          <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 shadow-inner shrink-0">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
              <GraduationCap size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">EIU Capstone Project</p>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">Extra Center Management</p>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright Information */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} EIU Capstone Project. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <span>Built with Next.js & Tailwind</span>
          </div>
        </div>

      </div>
    </footer>
  );
}