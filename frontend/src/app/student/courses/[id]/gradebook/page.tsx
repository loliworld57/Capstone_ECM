"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GradebookResponse, gradebookService } from "@/services/gradebookService";

export default function StudentGradebookPage() {
  const params = useParams();
  const courseId = parseInt(params.id as string);
  const userId = parseInt(localStorage.getItem("userId") || "0"); // Get current user ID

  const [gradebook, setGradebook] = useState<GradebookResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGradebook = async () => {
      try {
        setLoading(true);
        const data = await gradebookService.getGradebook(courseId);
        setGradebook(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load gradebook");
      } finally {
        setLoading(false);
      }
    };

    fetchGradebook();
  }, [courseId]);

  if (loading) return <div className="p-8 text-center">Loading your grades...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!gradebook) return <div className="p-8 text-center">No gradebook data available</div>;

  // Find current student
  const currentStudent = gradebook.students.find((s) => s.studentId === userId);

  if (!currentStudent) {
    return <div className="p-8 text-center">You are not enrolled in this course</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{gradebook.courseName} - Your Grades</h1>
          <p className="text-gray-600">Your course scores and performance</p>
        </div>

        {/* Overall Performance Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Overall Performance</h2>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 text-center">
            <p className="text-sm font-medium opacity-90">Final Score</p>
            <p className="text-5xl font-bold mt-2">
              {currentStudent.finalScore !== null && currentStudent.finalScore !== undefined
                ? currentStudent.finalScore.toFixed(2)
                : "-"}
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Category Breakdown</h2>
          <div className="space-y-4">
            {gradebook.categories.map((category) => {
              const categoryAverage = currentStudent.categoryAverages[category.id];
              const categoryScoreItems = gradebook.scoreItems.filter(
                (item) => item.scoreCategoryId === category.id
              );

              return (
                <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <span className="text-sm text-gray-600">Weight: {category.weight}%</span>
                  </div>

                  {/* Category average */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">Average Score</p>
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${categoryAverage !== null && categoryAverage !== undefined ? categoryAverage : 0}%`,
                          }}
                        ></div>
                      </div>
                      <span className="ml-3 text-lg font-bold text-gray-900">
                        {categoryAverage !== null && categoryAverage !== undefined
                          ? categoryAverage.toFixed(2)
                          : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Score items in this category */}
                  <div className="grid grid-cols-2 gap-2">
                    {categoryScoreItems.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-600">{item.name}</p>
                        <p className="text-lg font-bold text-gray-900">
                          {currentStudent.scores[item.id] !== null && currentStudent.scores[item.id] !== undefined
                            ? currentStudent.scores[item.id]
                            : "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* All Scores Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">All Scores</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Score Item</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Score</th>
                </tr>
              </thead>
              <tbody>
                {gradebook.scoreItems.map((item) => {
                  const category = gradebook.categories.find((c) => c.id === item.scoreCategoryId);
                  const score = currentStudent.scores[item.id];
                  return (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{category?.name}</td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                        {score !== null && score !== undefined ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                            {score}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
