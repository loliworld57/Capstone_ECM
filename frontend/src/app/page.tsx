"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import BannerSlider from "@/components/BannerSlide";
import FeatureCard from "@/components/FeatureCard";
import cardImg from "@/imgs/home/card-1.jpg";
import GuideCard from "@/components/GuideCard";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  const guides = [
    {
      step: 1,
      title: "Create an Account",
      description: (
        <ul className="space-y-3 list-disc pl-5">
          <li>Register a new account in seconds</li>
          <li>Securely log in to your dashboard</li>
          <li>Access all management tools</li>
          <li>Start setting up your tutoring center</li>
        </ul>
      ),
    },
    {
      step: 2,
      title: "Configure Your Center",
      description: (
        <ul className="space-y-3 list-disc pl-5">
          <li>Add center information</li>
          <li>Configure subjects and courses</li>
          <li>Set schedules and operating hours</li>
          <li>Customize preferences</li>
        </ul>
      ),
    },
    {
      step: 3,
      title: "Start Managing",
      description: (
        <ul className="space-y-3 list-disc pl-5">
          <li>Add students and teachers</li>
          <li>Create classes and schedules</li>
          <li>Manage tuition payments</li>
          <li>Track center activities</li>
        </ul>
      ),
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      nextGuide();
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const [currentGuide, setCurrentGuide] = useState(0);

  const nextGuide = () => {
    setCurrentGuide((prev) => (prev === guides.length - 1 ? 0 : prev + 1));
  };

  const prevGuide = () => {
    setCurrentGuide((prev) => (prev === 0 ? guides.length - 1 : prev - 1));
  };

  return (
    // Fixed typo here: added space and explicitly used overflow-x-hidden
    <div className="">
      {/* 1. Hero Section */}
      <ScrollReveal>
        <div className="container mx-auto flex flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:gap-12 lg:py-12">
          <div className="flex w-full flex-col justify-center text-center lg:w-2/5 lg:text-left">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-4xl font-extrabold leading-tight">
                Easily Manage Your{" "}
                <span className="block bg-gradient-to-r from-[var(--color-main)] to-[var(--color-secondary)] bg-clip-text text-transparent">
                  Tutor Center
                </span>
              </h1>
            </div>
            <p className="mt-6 text-lg text-gray-600 max-w-xl">
              Try a new way to manage your own tutor center with all your needs in one
              place. Track students, teachers, schedules and finances in one simple
              dashboard.
            </p>

            <div className="mt-6 flex justify-center lg:justify-start">
              <Link href="/register" className="self-start main-btn font-bold">
                I'm ready to get started
              </Link>
            </div>
          </div>

          <div className="h-64 w-full overflow-hidden rounded-lg shadow-lg sm:h-80 md:h-96 lg:w-3/5">
            <BannerSlider />
          </div>
        </div>
      </ScrollReveal>

      {/* 2. Features Section */}
      <ScrollReveal>
        <div className="mx-auto bg-linear-to-r from-indigo-500 from-5% via-[var(--color-main)] via-50% to-indigo-500 to-95% py-12 text-center">
          <h2 className="header-2 text-[var(--color-soft-white)] mb-8">
            Our Main Features
          </h2>
          <div className="container mx-auto grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-8 px-4 sm:px-6">
            <FeatureCard
              title="Student"
              image={cardImg}
              description={
                <ul className="list-disc pl-5 space-y-1">
                  <li>Create and manage student profiles</li>
                  <li>Track enrollment and classes</li>
                  <li>Monitor academic progress</li>
                  <li>Store student records securely</li>
                </ul>
              }
            />

            <FeatureCard
              title="Teacher"
              image={cardImg}
              description={
                <ul className="list-disc pl-5 space-y-1">
                  <li>Add and manage teacher profiles</li>
                  <li>Assign teachers to classes</li>
                  <li>Manage teaching schedules</li>
                  <li>Track workload and performance</li>
                </ul>
              }
            />

            <FeatureCard
              title="Class & Schedule"
              image={cardImg}
              description={
                <ul className="list-disc pl-5 space-y-1">
                  <li>Create and organize classes</li>
                  <li>Assign students and teachers</li>
                  <li>Manage weekly schedules</li>
                  <li>Avoid timetable conflicts</li>
                </ul>
              }
            />

            <FeatureCard
              title="Finance & AI"
              image={cardImg}
              description={
                <ul className="list-disc pl-5 space-y-1">
                  <li>Manage Finance</li>
                  <li>AI Quiz Generation</li>
                  <li>Summarize Documentation</li>
                  <li>Tuition Management</li>
                </ul>
              }
            />
          </div>
        </div>
      </ScrollReveal>

      {/* 3. How It Works Section */}
      <ScrollReveal>
        <div className="container mx-auto px-4 py-16 sm:px-6">
          <h2 className="header-2 text-center mb-12">How It Works</h2>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentGuide}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <GuideCard
                  step={guides[currentGuide].step}
                  title={guides[currentGuide].title}
                  image={cardImg}
                  description={guides[currentGuide].description}
                />
              </motion.div>
            </AnimatePresence>

            <button
              onClick={prevGuide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-3 hover:scale-110 transition"
            >
              <ChevronLeft />
            </button>

            <button
              onClick={nextGuide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-3 hover:scale-110 transition"
            >
              <ChevronRight />
            </button>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            {guides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentGuide(index)}
                className={`h-3 w-3 rounded-full transition-all ${currentGuide === index ? "bg-[var(--color-main)] w-8" : "bg-gray-300"}`}
              />
            ))}
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}