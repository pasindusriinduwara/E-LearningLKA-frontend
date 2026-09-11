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
  status: string;
  hidden?: boolean;
  submitted?: boolean;
  scoreObtained?: number;
  grade?: string;
  submissionsCount?: number;
  totalStudents?: number;
  createdAt?: string;
}

export interface StudentQuizTakeResponse {
  id: string;
  title: string;
  batchId: string;
  batchName: string;
  assessmentType: string;
  totalMarks: number;
  durationMinutes: number;
  dueDate: string;
  questions: StudentQuestionDto[];
}

export interface StudentQuestionDto {
  id: string;
  questionText: string;
  displayOrder: number;
  marks: number;
  options: StudentOptionDto[];
}

export interface StudentOptionDto {
  id: string;
  optionText: string;
  displayOrder: number;
}

export interface QuizSubmissionPayload {
  studentId?: string;
  answers: {
    questionId: string;
    selectedOptionId?: string;
  }[];
}

export interface QuizSubmissionResult {
  submissionId: string;
  assessmentId: string;
  title: string;
  scoreObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
  answers: ReviewAnswer[];
}

export interface ReviewAnswer {
  questionId: string;
  questionText: string;
  selectedOptionId?: string;
  correctOptionId?: string;
  isCorrect: boolean;
  marksAwarded: number;
  explanation?: string;
  options: {
    id: string;
    optionText: string;
    isCorrect: boolean;
  }[];
}

export interface UpdateAssessmentPayload {
  title?: string;
  totalMarks?: number;
  dueDate?: string;
  durationMinutes?: number;
  hidden?: boolean;
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

  /**
   * Retrieves assessment details with questions and options
   */
  async getAssessmentDetails(id: string): Promise<any> {
    return fetchApi(`/assessments/${id}`);
  },

  /**
   * Retrieves student visible assessments (non-hidden)
   */
  async getStudentAssessments(studentId?: string): Promise<AssessmentSummary[]> {
    const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
    return fetchApi<AssessmentSummary[]>(`/assessments/student${query}`);
  },

  /**
   * Secure student quiz payload for taking an exam (no answer leaks)
   */
  async getAssessmentForTaking(id: string): Promise<StudentQuizTakeResponse> {
    return fetchApi<StudentQuizTakeResponse>(`/assessments/${id}/take`);
  },

  /**
   * Submits student quiz answers for server-side grading
   */
  async submitQuiz(id: string, payload: QuizSubmissionPayload): Promise<QuizSubmissionResult> {
    return fetchApi<QuizSubmissionResult>(`/assessments/${id}/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Retrieves student's graded submission and answer review
   */
  async getStudentSubmission(id: string, studentId?: string): Promise<QuizSubmissionResult> {
    const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
    return fetchApi<QuizSubmissionResult>(`/assessments/${id}/my-submission${query}`);
  },

  /**
   * Retrieves all student submissions for an assessment (Teacher view)
   */
  async getAssessmentSubmissions(id: string): Promise<any[]> {
    return fetchApi<any[]>(`/assessments/${id}/submissions`);
  },

  /**
   * Toggles visibility (hide/unhide) of an assessment for students
   */
  async toggleHideAssessment(id: string): Promise<any> {
    return fetchApi(`/assessments/${id}/toggle-hide`, {
      method: "PATCH",
    });
  },

  /**
   * Updates an existing assessment
   */
  async updateAssessment(id: string, payload: UpdateAssessmentPayload): Promise<any> {
    return fetchApi(`/assessments/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Soft deletes an assessment
   */
  async deleteAssessment(id: string): Promise<void> {
    return fetchApi<void>(`/assessments/${id}`, {
      method: "DELETE",
    });
  },
};
