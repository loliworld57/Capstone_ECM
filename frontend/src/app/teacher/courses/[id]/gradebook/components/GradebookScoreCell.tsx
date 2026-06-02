import { useState, useEffect } from "react";

interface GradebookScoreCellProps {
  studentId: number;
  scoreItemId: number;
  score: number | null | undefined;
  editable: boolean;
  onChange: (studentId: number, scoreItemId: number, score: number) => void;
}

export default function GradebookScoreCell({
  studentId,
  scoreItemId,
  score,
  editable,
  onChange,
}: GradebookScoreCellProps) {
  const [value, setValue] = useState<string>(score !== null && score !== undefined ? String(score) : "");

  useEffect(() => {
    setValue(score !== null && score !== undefined ? String(score) : "");
  }, [score, editable]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setValue(inputValue);

    if (inputValue === "") {
      // Allow clearing the value
      return;
    }

    const numValue = parseInt(inputValue);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      onChange(studentId, scoreItemId, numValue);
    }
  };

  if (!editable) {
    const scoreClass =
      score == null
        ? "text-gray-400"
        : score < 50
          ? "text-red-600 bg-red-50"
          : "text-emerald-600 bg-emerald-50";

    return (
      <div
        className={`p-2 text-center min-w-20 rounded font-semibold ${scoreClass}`}
      >
        {score ?? "-"}
      </div>
    );
  }

  return (
    <input
      type="number"
      min="0"
      max="100"
      value={value}
      onChange={handleChange}
      className="w-full p-2 border border-blue-300 rounded text-center bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="-"
    />
  );
}
