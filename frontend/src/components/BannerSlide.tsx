"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import banner1 from "@/imgs/home/banner-1.jpg";
import banner2 from "@/imgs/home/banner-2.jpg";
import banner3 from "@/imgs/home/banner-3.png";
import banner4 from "@/imgs/home/banner-4.png";

export default function BannerSlider() {
  const banners = [banner1, banner2, banner3, banner4];
  const [current, setCurrent] = useState(0);


  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % banners.length);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg">
      {/* Slides */}
      {banners.map((src, idx) => (
        <Image
          key={idx}
          src={src}
          alt={`Banner ${idx + 1}`}
          fill
          priority={idx === 0}
          className={`object-contain transition-opacity duration-700 ease-in-out ${idx === current ? "opacity-100" : "opacity-0"
            }`}
        />
      ))}

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            title={`Go to slide ${idx + 1}`}
            aria-label={`Go to slide ${idx + 1}`}
            className={`w-3 h-3 rounded-full ${idx === current ? "bg-white" : "bg-white/50"
              }`}
          />
        ))}
      </div>

      {/* Prev Button */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/50 p-2 rounded-full text-[var(--color-secondary)] font-bold"
      >
        ❮
      </button>

      {/* Next Button */}
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/50 p-2 rounded-full text-[var(--color-secondary)] font-bold"
      >
        ❯
      </button>
    </div>
  );
}