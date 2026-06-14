"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  GraduationCap,
  CalendarDays,
  Cpu,
  UserPlus,
  Settings,
  Layers,
  Sparkles,
  ArrowRight
} from "lucide-react";

import Link from "next/link";
import BannerSlider from "@/components/BannerSlide";
import FeatureCard from "@/components/FeatureCard";
import GuideCard from "@/components/GuideCard";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  const guides = [
    {
      step: 1,
      title: "Create an Account",
      icon: <UserPlus className="w-5 h-5" />,
      description: (
        <ul className="space-y-2 text-gray-600 text-sm list-none pl-0">
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-main)] font-bold">✓</span> Register a new workspace in seconds
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-main)] font-bold">✓</span> Securely authenticate your dashboard
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-main)] font-bold">✓</span> Access global management toolkits
          </li>
        </ul>
      ),
    },
    {
      step: 2,
      title: "Configure Your Center",
      icon: <Settings className="w-5 h-5" />,
      description: (
        <ul className="space-y-2 text-gray-600 text-sm list-none pl-0">
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-main)] font-bold">✓</span> Customize operations parameters
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-main)] font-bold">✓</span> Provision subject weight items
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-main)] font-bold">✓</span> Establish systemic timetable limits
          </li>
        </ul>
      ),
    },
    {
      step: 3,
      title: "Start Managing",
      icon: <Layers className="w-5 h-5" />,
      description: (
        <ul className="space-y-2 text-gray-600 text-sm list-none pl-0">
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-main)] font-bold">✓</span> Onboard master workspace rosters
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-main)] font-bold">✓</span> Coordinate real-time payment loops
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-main)] font-bold">✓</span> Automate lesson logs with AI
          </li>
        </ul>
      ),
    },
  ];

  return (
    <div className="bg-[var(--color-soft-white)] text-gray-900 min-h-screen selection:bg-indigo-500 selection:text-white">
      
      {/* 1. Hero Section Area */}
      <ScrollReveal>
        <div className="container mx-auto px-4 pt-12 pb-20 sm:px-6 lg:pt-20 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Descriptive Content Box */}
            <div className="lg:col-span-5 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-xs">
                <Sparkles size={14} className="text-indigo-500" /> Next-Generation Center Infrastructure
              </div>
              
              {/* Structured Headline Split */}
              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-black tracking-tight leading-tight text-gray-900 flex flex-col">
                <span className="block">Easily Manage Your</span>
                <span className="bg-gradient-to-r from-indigo-600 via-[var(--color-main)] to-indigo-500 bg-clip-text text-transparent pb-1">
                  Tutor Center
                </span>
              </h1>
              
              <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                A streamlined workspace built to empower educators. Track student progression, handle complex timetable operations, and automate financial layers with complete oversight.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link 
                  href="/register" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-linear-to-r from-indigo-500 to-[var(--color-main)] hover:opacity-95 text-white font-bold px-6 py-3.5 rounded-xl shadow-md shadow-indigo-500/10 active:scale-98 transition transform duration-150"
                >
                  Get Started Free <ArrowRight size={16} />
                </Link>
                <a 
                  href="#video-insight" 
                  className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-semibold text-gray-500 hover:text-gray-900 px-5 py-3 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Slider Visual Presentation Box */}
            <div className="lg:col-span-7 w-full aspect-video lg:h-96 overflow-hidden rounded-2xl shadow-xl border border-gray-200/60 bg-white relative group">
              <BannerSlider />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Video Block Section */}
      <ScrollReveal>
        <div id="video-insight" className="w-full bg-white border-y border-gray-200/50 py-20 px-4">
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Pedagogical Philosophy</span>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                What Makes a Teacher Great?
              </h2>
            </div>
            
            <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-black group relative">
              <iframe
                className="w-full h-full opacity-95 group-hover:opacity-100 transition-opacity duration-300"
                src="https://www.youtube.com/embed/vrU6YJle6Q4"
                title="Why do we need education"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 2. Features Section */}
      <ScrollReveal>
        <div className="bg-linear-to-b from-indigo-600 via-[var(--color-main)] to-indigo-700 py-24 shadow-inner">
          
          <div className="max-w-3xl mx-auto mb-16 px-4 flex flex-col items-center gap-3 text-center">
            <span className="text-xs font-bold uppercase tracking-widest bg-white/10 text-indigo-100 border border-white/10 px-3 py-1 rounded-full backdrop-blur-xs">
              System Architecture
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Our Main Features
            </h2>
            <p className="text-indigo-100/90 text-sm md:text-base max-w-xl leading-relaxed">
              Everything you need to scale operations, manage classrooms, and automate center finances in one unified workspace.
            </p>
          </div>

          <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-4 sm:px-6 max-w-5xl">
            <FeatureCard
              title="Student Management"
              icon={<Users className="w-8 h-8 text-[var(--color-main)]" />}
              description={
                <ul className="space-y-2.5 text-gray-600 text-sm">
                  <li>• Onboard students and manage their enrollment profiles</li>
                  <li>• Monitor structural attendance patterns per section</li>
                  <li>• Compute weighted gradebook item aggregations</li>
                  <li>• Launch real-time test validation matrices</li>
                </ul>
              }
            />

            <FeatureCard
              title="Teacher Workspace"
              icon={<GraduationCap className="w-8 h-8 text-[var(--color-main)]" />}
              description={
                <ul className="space-y-2.5 text-gray-600 text-sm">
                  <li>• Allocate lesson tracks and track student homework</li>
                  <li>• Track log assignments using custom criteria settings</li>
                  <li>• Populate content vaults with external digital assets</li>
                  <li>• Evaluate text outputs directly from the browser</li>
                </ul>
              }
            />

            <FeatureCard
              title="Class & Schedule"
              icon={<CalendarDays className="w-8 h-8 text-[var(--color-main)]" />}
              description={
                <ul className="space-y-2.5 text-gray-600 text-sm">
                  <li>• Map structural layouts for dynamic classroom models</li>
                  <li>• Establish recurring exceptions for calendar holidays</li>
                  <li>• Validate user conflict limits automatically</li>
                  <li>• Synchronize timetable parameters cleanly</li>
                </ul>
              }
            />

            <FeatureCard
              title="Finance & AI Core"
              icon={<Cpu className="w-8 h-8 text-[var(--color-main)]" />}
              description={
                <ul className="space-y-2.5 text-gray-600 text-sm">
                  <li>• Supervise modular installment subscription workflows</li>
                  <li>• Compute dynamic monthly center payout distributions</li>
                  <li>• Produce quiz templates instantaneously via AI engines</li>
                  <li>• Summarize reading materials for rapid student access</li>
                </ul>
              }
            />
          </div>
        </div>
      </ScrollReveal>

      {/* 3. How It Works Section */}
      <ScrollReveal>
        <div className="container mx-auto px-4 py-24 sm:px-6 max-w-6xl">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 font-bold">Deployment Guide</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">How It Works</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">Initialize your educational workspace layer in three simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {guides.map((item, index) => (
              <div 
                key={index} 
                className="bg-white border border-gray-200/80 rounded-2xl p-6 relative flex flex-col gap-4 hover:border-gray-300 hover:shadow-lg transition-all duration-200"
              >
                {/* Visual Step Floating Badge */}
                <div className="absolute -top-4 -left-3 bg-linear-to-br from-indigo-500 to-[var(--color-main)] text-white font-black text-xs h-8 w-8 rounded-lg flex items-center justify-center shadow-md">
                  0{item.step}
                </div>
                
                <div className="flex items-center gap-3 mt-2">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                    {item.title}
                  </h3>
                </div>

                <div className="mt-2 text-gray-600 leading-relaxed">
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}