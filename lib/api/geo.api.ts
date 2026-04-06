import { apiClient } from "./client";

export type GeoDifficultyLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type GeoQuestionType = "multiple-choice" | "true-false" | "fill-blank";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeoAskResponse {
    answer: string;
    chapterId: string;
    difficultyLevel: GeoDifficultyLevel;
    pointsEarned?: number;
    currentStreak?: number;
    newAchievements?: string[];
}

export interface GeoHistoryMessage {
    role: "user" | "geo";
    content: string;
    createdAt?: string | null;
}

export interface GeoHistoryResponse {
    courseId: string;
    chapterId: string;
    messages: GeoHistoryMessage[];
}

export interface GeoQuizQuestion {
    id: string;
    question: string;
    type: GeoQuestionType;
    options?: string[];
}

export interface GeoQuizResponse {
    quizId: string;
    difficultyLevel: GeoDifficultyLevel;
    questions: GeoQuizQuestion[];
}

export interface GeoQuizResult {
    question: string;
    type: GeoQuestionType;
    options?: string[];
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
}

export interface GeoQuizSubmitResponse {
    score: number;
    totalQuestions: number;
    percentage: number;
    pointsEarned: number;
    difficultyLevel: GeoDifficultyLevel;
    results: GeoQuizResult[];
    newAchievements: string[];
}

export interface GeoExplanationResponse {
    explanation: string;
    examples: string[];
    relatedConcepts: string[];
    prerequisites?: string[];
}

export interface GeoUserProfile {
    totalPoints: number;
    questionsAsked: number;
    quizzesCompleted: number;
    imagesShared: number;
    currentStreak: number;
    bestStreak: number;
    preferredDifficultyLevel: GeoDifficultyLevel;
    unlockedAchievements: string[];
}

export interface GeoAchievement {
    identifier: string;
    title: string;
    description: string;
    icon: string;
    points: number;
    type: string;
    threshold: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

function extractPayload(response: any) {
    return response?.data && typeof response.data === "object"
        ? response.data
        : response;
}

export const geoApi = {
    /**
     * Ask Geo a question about a chapter (supports image upload)
     */
    askQuestion: async (
        courseId: string,
        chapterId: string,
        question: string,
        options?: {
            difficultyLevel?: GeoDifficultyLevel;
            image?: File;
        },
    ): Promise<GeoAskResponse> => {
        let response: any;

        if (options?.image) {
            const formData = new FormData();
            formData.append("question", question);
            if (options.difficultyLevel) {
                formData.append("difficultyLevel", options.difficultyLevel);
            }
            formData.append("image", options.image);

            response = await apiClient.uploadFile(
                `/ai/geo/courses/${courseId}/chapters/${chapterId}/ask`,
                options.image,
                "image",
                {
                    question,
                    ...(options.difficultyLevel
                        ? { difficultyLevel: options.difficultyLevel }
                        : {}),
                },
            );
        } else {
            response = await apiClient.post(
                `/ai/geo/courses/${courseId}/chapters/${chapterId}/ask`,
                {
                    question,
                    difficultyLevel: options?.difficultyLevel,
                },
            );
        }

        const payload = extractPayload(response);
        const answer =
            typeof payload?.answer === "string" ? payload.answer.trim() : "";

        if (!answer) throw new Error("Geo returned an empty response");

        return {
            answer,
            chapterId: String(payload?.chapterId || chapterId),
            difficultyLevel:
                payload?.difficultyLevel || options?.difficultyLevel || "intermediate",
            pointsEarned: payload?.pointsEarned,
            currentStreak: payload?.currentStreak,
            newAchievements: payload?.newAchievements || [],
        };
    },

    /**
     * Get Geo conversation history for a chapter
     */
    getHistory: async (
        courseId: string,
        chapterId: string,
    ): Promise<GeoHistoryResponse> => {
        const response = await apiClient.get<any>(
            `/ai/geo/courses/${courseId}/chapters/${chapterId}/history`,
        );
        const payload = extractPayload(response);
        const rawMessages = Array.isArray(payload?.messages) ? payload.messages : [];

        return {
            courseId: String(payload?.courseId || courseId),
            chapterId: String(payload?.chapterId || chapterId),
            messages: rawMessages
                .map((m: any) => ({
                    role: m.role === "user" ? "user" : "geo",
                    content:
                        typeof m.content === "string" ? m.content.trim() : "",
                    createdAt: m.createdAt || null,
                }))
                .filter((m: GeoHistoryMessage) => m.content.length > 0),
        };
    },

    /**
     * Generate a quiz for a chapter
     */
    generateQuiz: async (
        courseId: string,
        chapterId: string,
        options: {
            difficultyLevel: GeoDifficultyLevel;
            questionCount?: number;
            questionTypes?: GeoQuestionType[];
        },
    ): Promise<GeoQuizResponse> => {
        const response = await apiClient.post<any>(
            `/ai/geo/courses/${courseId}/chapters/${chapterId}/quiz/generate`,
            {
                difficultyLevel: options.difficultyLevel,
                questionCount: options.questionCount || 5,
                questionTypes: options.questionTypes,
            },
        );
        const payload = extractPayload(response);
        return payload as GeoQuizResponse;
    },

    /**
     * Submit quiz answers and get results
     */
    submitQuiz: async (
        quizId: string,
        answers: { questionId: string; answer: string }[],
    ): Promise<GeoQuizSubmitResponse> => {
        const response = await apiClient.post<any>(
            `/ai/geo/quiz/${quizId}/submit`,
            { answers },
        );
        const payload = extractPayload(response);
        return payload as GeoQuizSubmitResponse;
    },

    /**
     * Get a detailed explanation for a topic
     */
    getExplanation: async (
        courseId: string,
        chapterId: string,
        topic: string,
        difficultyLevel: GeoDifficultyLevel,
    ): Promise<GeoExplanationResponse> => {
        const response = await apiClient.post<any>(
            `/ai/geo/courses/${courseId}/chapters/${chapterId}/explain`,
            { topic, difficultyLevel },
        );
        const payload = extractPayload(response);
        return payload as GeoExplanationResponse;
    },

    /**
     * Get the user's Geo profile
     */
    getProfile: async (): Promise<GeoUserProfile> => {
        const response = await apiClient.get<any>("/ai/geo/profile");
        const payload = extractPayload(response);
        return payload as GeoUserProfile;
    },

    /**
     * Update preferred difficulty level
     */
    updateDifficulty: async (
        difficultyLevel: GeoDifficultyLevel,
    ): Promise<void> => {
        await apiClient.patch("/ai/geo/profile/difficulty", { difficultyLevel });
    },

    /**
     * Get all Geo achievements
     */
    getAchievements: async (): Promise<GeoAchievement[]> => {
        const response = await apiClient.get<any>("/ai/geo/achievements");
        const payload = extractPayload(response);
        return Array.isArray(payload) ? payload : [];
    },
};
