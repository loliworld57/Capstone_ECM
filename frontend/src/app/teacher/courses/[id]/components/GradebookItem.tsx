import { useState, useEffect } from "react";
import api from "@/utils/axiosConfig";

export interface GradebookItem {
    id: number;
    name: string;
}

export function useGradebookItems(courseId: number) {
    const [gradebookItems, setGradebookItems] = useState<GradebookItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

    useEffect(() => {
        const fetchItems = async () => {
            if (!courseId) return;
            setLoadingItems(true);
            try {
                // Hits the endpoint we mapped out in our backend service layer
                const res = await api.get(`/quizzes/course/${courseId}/gradebook-items`);
                setGradebookItems(res.data || []);
            } catch (err) {
                console.error("Error loading gradebook columns:", err);
            } finally {
                setLoadingItems(false);
            }
        };
        fetchItems();
    }, [courseId]);

    return { gradebookItems, loadingItems };
}