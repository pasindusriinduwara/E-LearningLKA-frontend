import { fetchApi } from "@/lib/api";
import { ParsedQuestion, parseQuizTextLocally } from "@/lib/utils/quizParser";

export interface BackendParsedQuestion {
  questionNumber: number;
  questionText: string;
  marks: number;
  confidence: number;
  hasCorrectAnswer: boolean;
  options: {
    label: string;
    text: string;
    correct: boolean;
  }[];
  warning?: string;
}

export interface SaveQuizPayload {
  batchId: string;
  title: string;
  assessmentType: string;
  totalMarks: number;
  dueDate?: string;
  durationMinutes: number;
  questions: {
    questionText: string;
    marks: number;
    displayOrder: number;
    options: {
      optionText: string;
      isCorrect?: boolean;
      correct?: boolean;
    }[];
  }[];
}

export interface AssessmentSummary {
  id: string;
  batchId: string;
  batchName?: string;
  title: string;
  assessmentType: string;
  totalMarks: number;
  dueDate?: string;
  durationMinutes: number;
  questionCount: number;
  status?: string;
  submissionsCount?: number;
  totalStudents?: number;
  createdAt: string;
}

export const assessmentService = {
  /**
   * Uploads PDF file to backend PDFBox parser
   */
  async parsePdfFile(file: File): Promise<ParsedQuestion[]> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetchApi<BackendParsedQuestion[]>("/assessments/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (Array.isArray(res)) {
        return res.map((q, idx) => ({
          id: `q_${Date.now()}_${idx}`,
          questionNumber: q.questionNumber || idx + 1,
          questionText: q.questionText || "",
          marks: q.marks || 1,
          confidence: q.confidence ?? 1.0,
          hasCorrectAnswer: q.hasCorrectAnswer ?? false,
          warning: q.warning,
          options: (q.options || []).map((opt) => ({
            label: opt.label || "A",
            text: opt.text || "",
            isCorrect: opt.correct ?? false,
          })),
        }));
      }
    } catch (err: unknown) {
      console.error("Backend PDF parse failed:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("NoClassDefFoundError") || errMsg.includes("500") || errMsg.includes("Failed to fetch")) {
        throw new Error("Backend server needs a quick restart to load PDFBox libraries. Please restart 'mvn spring-boot:run' in your backend terminal.");
      }
      throw err;
    }

    return [];
  },

  /**
   * Parses raw quiz text (backend or client)
   */
  async parseRawText(rawText: string): Promise<ParsedQuestion[]> {
    try {
      const res = await fetchApi<BackendParsedQuestion[]>("/assessments/parse-text", {
        method: "POST",
        body: JSON.stringify({ rawText }),
      });

      if (Array.isArray(res) && res.length > 0) {
        return res.map((q, idx) => ({
          id: `q_${Date.now()}_${idx}`,
          questionNumber: q.questionNumber || idx + 1,
          questionText: q.questionText || "",
          marks: q.marks || 1,
          confidence: q.confidence ?? 1.0,
          hasCorrectAnswer: q.hasCorrectAnswer ?? false,
          warning: q.warning,
          options: (q.options || []).map((opt) => ({
            label: opt.label || "A",
            text: opt.text || "",
            isCorrect: opt.correct ?? false,
          })),
        }));
      }
    } catch (err) {
      console.warn("Backend text parse failed, running locally:", err);
    }

    // Free client-side fallback
    return parseQuizTextLocally(rawText);
  },

  /**
   * Persists reviewed quiz into PostgreSQL
   */
  async saveQuiz(payload: SaveQuizPayload): Promise<{ id: string }> {
    return fetchApi<{ id: string }>("/assessments/quiz", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Retrieves all assessments
   */
  async getAllAssessments(): Promise<AssessmentSummary[]> {
    return fetchApi<AssessmentSummary[]>("/assessments");
  },

  /**
   * Retrieves assessments for batch
   */
  async getBatchAssessments(batchId: string): Promise<AssessmentSummary[]> {
    return fetchApi<AssessmentSummary[]>(`/assessments/batch/${batchId}`);
  },
};
