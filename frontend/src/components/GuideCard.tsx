"use client";

import Image, { StaticImageData } from "next/image";

type GuideCardProps = {
  step: number;
  title: string;
  image: StaticImageData | string;
  description: React.ReactNode;
};

export default function GuideCard({
  step,
  title,
  image,
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
      <div className="grid md:grid-cols-2 min-h-[420px]">
        {/* Image */}
        <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50">
          <Image
            src={image}
            alt={title}
            fill
            className="object-contain p-8"
          />
        </div>

        {/* Content */}
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

          <div className="mt-6 text-gray-600">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}