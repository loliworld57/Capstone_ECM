"use client";

import { useParams } from "next/navigation";
import GradebookSection from "../components/GradebookSection";

export default function GradebookPage() {
  const params = useParams();
  const courseId = Number(params.id);

  return <GradebookSection courseId={courseId} />;
}
