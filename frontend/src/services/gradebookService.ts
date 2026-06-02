import api from "@/utils/axiosConfig";

interface ScoreCategory {
  id: number;
  name: string;
  weight: number;
}

interface ScoreItem {
  id: number;
  name: string;
  scoreCategoryId: number;
  assignmentId?: number;
}

interface StudentScore {
  studentId: number;
  scoreItemId: number;
  score: number;
}

interface GradebookResponse {
  courseId: number;
  courseName: string;
  categories: ScoreCategory[];
  scoreItems: ScoreItem[];
  students: StudentGradebookRow[];
  totalWeight: number;
  weightComplete: boolean;
}

interface StudentGradebookRow {
  studentId: number;
  firstName: string;
  lastName: string;
  scores: Record<number, number | null>;
  categoryAverages: Record<number, number | null>;
  finalScore: number | null;
}

export const gradebookService = {
  // Get complete gradebook data
  async getGradebook(courseId: number): Promise<GradebookResponse> {
    const response = await api.get(`/courses/${courseId}/gradebook`);
    return response.data;
  },

  // Score Categories
  async getCategories(courseId: number): Promise<ScoreCategory[]> {
    const response = await api.get(`/courses/${courseId}/score-categories`);
    return response.data;
  },

  async createCategory(courseId: number, data: { name: string; weight: number }): Promise<ScoreCategory> {
    const response = await api.post(`/courses/${courseId}/score-categories`, data);
    return response.data;
  },

  async updateCategory(courseId: number, categoryId: number, data: { name: string; weight: number }): Promise<ScoreCategory> {
    const response = await api.put(`/courses/${courseId}/score-categories/${categoryId}`, data);
    return response.data;
  },

  async deleteCategory(courseId: number, categoryId: number): Promise<void> {
    await api.delete(`/courses/${courseId}/score-categories/${categoryId}`);
  },

  // Score Items
  async createScoreItem(courseId: number, scoreCategoryId: number, data: { name: string; assignmentId?: number }): Promise<ScoreItem> {
    const response = await api.post(
      `/courses/${courseId}/score-categories/${scoreCategoryId}/score-items`,
      data
    );
    return response.data;
  },

  async updateScoreItem(
    courseId: number,
    scoreItemId: number,
    data: { name: string; scoreCategoryId?: number; assignmentId?: number } // Added scoreCategoryId here
  ): Promise<ScoreItem> {
    const response = await api.put(`/courses/${courseId}/score-items/${scoreItemId}`, data);
    return response.data;
  },

  async deleteScoreItem(courseId: number, scoreItemId: number): Promise<void> {
    await api.delete(`/courses/${courseId}/score-items/${scoreItemId}`);
  },

  // Student Scores
  async updateStudentScore(courseId: number, data: StudentScore): Promise<any> {
    const response = await api.put(`/courses/${courseId}/student-scores`, data);
    return response.data;
  },

  async bulkUpdateStudentScores(courseId: number, data: StudentScore[]): Promise<any[]> {
    const response = await api.put(`/courses/${courseId}/student-scores/bulk`, data);
    return response.data;
  },
};

export type { GradebookResponse, ScoreCategory, ScoreItem, StudentScore, StudentGradebookRow };
