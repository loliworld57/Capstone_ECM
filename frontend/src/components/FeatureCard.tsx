"use client";

import Image, { StaticImageData } from "next/image";

type FeatureCardProps = {
  title: string;
  image: StaticImageData | string;
  description: string | React.ReactNode;
};

export default function FeatureCard({ title, image, description }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col group border border-gray-100 aspect-[4/3] w-full">
      
      {/* Title Header */}
      <div className="bg-[var(--color-secondary)] py-2 px-4 m-3 rounded-lg z-10 shrink-0">
        <h3 className="text-[var(--color-text)] font-extrabold text-sm text-center uppercase tracking-wider">
          {title}
        </h3>
      </div>

      {/* Image & Interactive Slide Content Outer Box */}
      <div className="relative flex-1 w-full bg-gray-50/50 overflow-hidden min-h-0">
        
        {/* Image Layout Frame (Blurs out slightly on overlay activation) */}
        <div className="absolute inset-0 p-4 transition-all duration-500 group-hover:scale-95 group-hover:blur-xs">
          <div className="relative w-full h-full">
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Dynamic Overlay Container (Slides up from the bottom edge) */}
        <div className="absolute inset-0 translate-y-full group-hover:translate-y-0 bg-[var(--color-soft-white)]/95 text-[var(--color-text)] p-5 transition-transform duration-300 ease-out overflow-y-auto no-scrollbar flex flex-col justify-center">
          <div className="text-sm text-left">
            {description}
          </div>
        </div>

      </div>
    </div>
  );
}