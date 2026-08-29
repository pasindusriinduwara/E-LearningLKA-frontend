"use client";

import { useState, useMemo } from "react";
import {
  ClipboardCheck,
  Clock3,
  CheckCircle2,
  PlayCircle,
  FileText,
  Search,
  ChevronRight,
  X,
  Award,
  HelpCircle,
  FileCheck,
  Send,
  Timer,
} from "lucide-react";

export type AssessmentStatus = "To do" | "In progress" | "Graded";

export interface QuestionItem {
  id: number;
  question: string;
  options: string[];
  selectedOption?: number;
}

export interface AssessmentItem {
  id: string;
  title: string;
  subject: "Combined Mathematics" | "Chemistry" | "Physics";
  subjectCode: "math" | "chem" | "phys";
  teacher: string;
  type: "MCQ Quiz" | "Structured Paper" | "Assignment";
  questionsCount: number;
  duration: string;
  dueDate: string;
  status: AssessmentStatus;
  progress: number;
  totalMarks: number;
  score?: number;
  grade?: string;
  feedback?: string;
  questions?: QuestionItem[];
}

const mockAssessments: AssessmentItem[] = [
  {
    id: "asm-01",
    title: "Integration Techniques — Term Paper 02",
    subject: "Combined Mathematics",
    subjectCode: "math",
    teacher: "Mr. K. Perera",
    type: "Structured Paper",
    questionsCount: 20,
    duration: "60 mins",
    dueDate: "29 Aug 2026, 6:00 PM",
    status: "To do",
    progress: 0,
    totalMarks: 100,
    questions: [
      {
        id: 1,
        question: "Find the indefinite integral of ∫ (3x² + 4x - 5) dx with respect to x.",
        options: ["x³ + 2x² - 5x + C", "3x³ + 4x² - 5x + C", "6x + 4 + C", "x³ + 4x² - 5x + C"],
        selectedOption: 0,
      },
      {
        id: 2,
        question: "Evaluate the definite integral ∫ from 0 to 1 of e^(2x) dx.",
        options: ["(e² - 1) / 2", "e² - 1", "2(e² - 1)", "e² / 2"],
      },
      {
        id: 3,
        question: "Which substitution is most appropriate to evaluate ∫ x / √(1 - x²) dx?",
        options: ["u = 1 - x²", "u = sin(x)", "u = x²", "u = tan(x)"],
      },
    ],
  },
  {
    id: "asm-02",
    title: "Organic Reaction Mechanisms Quiz",
    subject: "Chemistry",
    subjectCode: "chem",
    teacher: "Ms. A. Fernando",
    type: "MCQ Quiz",
    questionsCount: 15,
    duration: "45 mins",
    dueDate: "31 Aug 2026, 8:00 PM",
    status: "In progress",
    progress: 40,
    totalMarks: 50,
    questions: [
      {
        id: 1,
        question: "Which of the following is the major product in the acid-catalyzed hydration of propene?",
        options: ["Propan-2-ol", "Propan-1-ol", "Propene oxide", "Propanoic acid"],
        selectedOption: 0,
      },
      {
        id: 2,
        question: "In nucleophilic substitution (SN2) reactions, the reaction proceeds with:",
        options: ["Complete inversion of configuration", "Retention of configuration", "Racemization", "No stereochemical change"],
        selectedOption: 0,
      },
      {
        id: 3,
        question: "What reagent is used to convert an alcohol into an alkyl chloride most cleanly?",
        options: ["SOCl₂ with pyridine", "NaCl with H₂O", "Cl₂ with light", "HCl with NaOH"],
      },
    ],
  },
  {
    id: "asm-03",
    title: "Waves & Oscillations Evaluation Test",
    subject: "Physics",
    subjectCode: "phys",
    teacher: "Mr. R. Silva",
    type: "MCQ Quiz",
    questionsCount: 25,
    duration: "75 mins",
    dueDate: "Submitted 22 Aug 2026",
    status: "Graded",
    progress: 100,
    totalMarks: 100,
    score: 88,
    grade: "A",
    feedback: "Excellent understanding of stationary waves and resonance tube calculations. Review Doppler effect sign conventions.",
  },
  {
    id: "asm-04",
    title: "Differential Equations Practice Evaluation",
    subject: "Combined Mathematics",
    subjectCode: "math",
    teacher: "Mr. K. Perera",
    type: "Structured Paper",
    questionsCount: 18,
    duration: "50 mins",
    dueDate: "Submitted 17 Aug 2026",
    status: "Graded",
    progress: 100,
    totalMarks: 100,
    score: 94,
    grade: "A+",
    feedback: "Outstanding work on integrating factor methods. All steps neatly laid out.",
  },
  {
    id: "asm-05",
    title: "Thermodynamics & Enthalpy Calculation Assignment",
    subject: "Chemistry",
    subjectCode: "chem",
    teacher: "Ms. A. Fernando",
    type: "Assignment",
    questionsCount: 10,
    duration: "60 mins",
    dueDate: "02 Sep 2026, 11:59 PM",
    status: "To do",
    progress: 0,
    totalMarks: 50,
  },
];

export function AssessmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");

  // Active quiz runner state
  const [activeQuiz, setActiveQuiz] = useState<AssessmentItem | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Review modal state
  const [reviewedAssessment, setReviewedAssessment] = useState<AssessmentItem | null>(null);

  // Filter assessments
  const filteredAssessments = useMemo(() => {
    return mockAssessments.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === "All" ||
        (selectedStatus === "To do" && item.status === "To do") ||
        (selectedStatus === "In progress" && item.status === "In progress") ||
        (selectedStatus === "Graded" && item.status === "Graded");

      const matchesSubject =
        selectedSubject === "All" || item.subject === selectedSubject;

      return matchesSearch && matchesStatus && matchesSubject;
    });
  }, [searchQuery, selectedStatus, selectedSubject]);

  // Statistics
  const stats = useMemo(() => {
    const todo = mockAssessments.filter((a) => a.status === "To do").length;
    const inProgress = mockAssessments.filter((a) => a.status === "In progress").length;
    const graded = mockAssessments.filter((a) => a.status === "Graded").length;
    const total = mockAssessments.length;
    return { todo, inProgress, graded, total };
  }, []);

  function handleStartQuiz(item: AssessmentItem) {
    setActiveQuiz(item);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setQuizSubmitted(false);
  }

  function handleSelectOption(qIndex: number, optionIndex: number) {
    setUserAnswers((prev) => ({
      ...prev,
      [qIndex]: optionIndex,
    }));
  }

  function handleSubmitQuiz() {
    setQuizSubmitted(true);
  }

  return (
    <div className="assessments-page-wrapper">
      {/* Page Header */}
      <header className="assessments-header">
        <div>
          <p className="assessments-eyebrow">ACADEMIC EVALUATIONS</p>
          <h1 className="assessments-title">Assessments</h1>
        </div>
        <div className="assessments-new-badge">
          <span>{stats.todo} pending submission</span>
        </div>
      </header>

      {/* Top 4 Metric Stat Cards */}
      <div className="assessments-stats-grid">
        {/* Card 1: To do */}
        <button
          type="button"
          className={`assessment-stat-card ${selectedStatus === "To do" ? "assessment-stat-active" : ""}`}
          onClick={() => setSelectedStatus(selectedStatus === "To do" ? "All" : "To do")}
        >
          <div className="asm-stat-icon asm-stat-yellow">
            <Clock3 size={22} />
          </div>
          <div className="asm-stat-info">
            <strong className="asm-stat-number">{String(stats.todo).padStart(2, "0")}</strong>
            <span className="asm-stat-label">To do</span>
          </div>
        </button>

        {/* Card 2: In progress */}
        <button
          type="button"
          className={`assessment-stat-card ${selectedStatus === "In progress" ? "assessment-stat-active" : ""}`}
          onClick={() => setSelectedStatus(selectedStatus === "In progress" ? "All" : "In progress")}
        >
          <div className="asm-stat-icon asm-stat-blue">
            <PlayCircle size={22} />
          </div>
          <div className="asm-stat-info">
            <strong className="asm-stat-number">{String(stats.inProgress).padStart(2, "0")}</strong>
            <span className="asm-stat-label">In progress</span>
          </div>
        </button>

        {/* Card 3: Graded */}
        <button
          type="button"
          className={`assessment-stat-card ${selectedStatus === "Graded" ? "assessment-stat-active" : ""}`}
          onClick={() => setSelectedStatus(selectedStatus === "Graded" ? "All" : "Graded")}
        >
          <div className="asm-stat-icon asm-stat-green">
            <CheckCircle2 size={22} />
          </div>
          <div className="asm-stat-info">
            <strong className="asm-stat-number">{String(stats.graded).padStart(2, "0")}</strong>
            <span className="asm-stat-label">Graded (Avg 91%)</span>
          </div>
        </button>

        {/* Card 4: Total Assigned */}
        <button
          type="button"
          className="assessment-stat-card"
          onClick={() => setSelectedStatus("All")}
        >
          <div className="asm-stat-icon asm-stat-slate">
            <ClipboardCheck size={22} />
          </div>
          <div className="asm-stat-info">
            <strong className="asm-stat-number">{String(stats.total).padStart(2, "0")}</strong>
            <span className="asm-stat-label">Total assigned</span>
          </div>
        </button>

      </div>

      {/* Search & Subject Filter Bar */}
      <div className="assessments-controls-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search assessments, subjects, teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="subject-filter-tabs">
          {["All", "To do", "In progress", "Graded"].map((statusTab) => {
            const isActive = selectedStatus === statusTab;
            return (
              <button
                key={statusTab}
                type="button"
                className={`subject-tab ${isActive ? "subject-tab-active" : ""}`}
                onClick={() => setSelectedStatus(statusTab)}
              >
                {statusTab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Assessments List */}
      <div className="assessments-cards-list">
        {filteredAssessments.map((item) => {
          return (
            <article className="assessment-item-card" key={item.id}>
              {/* Left Details Block */}
              <div className="assessment-item-main">
                <div className="assessment-top-meta">
                  <span
                    className={`subject-tag ${
                      item.subjectCode === "math"
                        ? "subject-tag-math"
                        : item.subjectCode === "chem"
                        ? "subject-tag-chem"
                        : "subject-tag-phys"
                    }`}
                  >
                    {item.subject.toUpperCase()}
                  </span>
                  <span className="assessment-type-pill">{item.type}</span>
                </div>

                <h3 className="assessment-card-title">{item.title}</h3>
                <p className="assessment-card-teacher">Uploaded by {item.teacher}</p>

                <div className="assessment-specs-row">
                  <span className="spec-item">
                    <FileText size={14} />
                    <span>{item.questionsCount} Questions</span>
                  </span>
                  <span className="spec-item">
                    <Clock3 size={14} />
                    <span>{item.duration}</span>
                  </span>
                  <span className="spec-item">
                    <Award size={14} />
                    <span>{item.totalMarks} Marks</span>
                  </span>
                  <span className="spec-due-date">
                    <span>{item.dueDate}</span>
                  </span>
                </div>

                {item.status === "In progress" && (
                  <div className="assessment-inline-progress">
                    <div className="progress-track-bg">
                      <div className="progress-track-fill" style={{ width: `${item.progress}%` }} />
                    </div>
                    <span>{item.progress}% completed</span>
                  </div>
                )}
              </div>

              {/* Right Action Block */}
              <div className="assessment-item-action-box">
                {item.status === "Graded" ? (
                  <div className="score-summary-badge">
                    <div className="score-number-box">
                      <span className="score-label">Score</span>
                      <strong className="score-val">{item.score}%</strong>
                    </div>
                    <span className="grade-pill">Grade {item.grade}</span>
                  </div>
                ) : (
                  <span
                    className={`status-badge ${
                      item.status === "To do" ? "status-badge-due" : "status-badge-progress"
                    }`}
                  >
                    {item.status}
                  </span>
                )}

                {item.status === "To do" && (
                  <button
                    type="button"
                    className="asm-action-btn asm-btn-primary"
                    onClick={() => handleStartQuiz(item)}
                  >
                    <span>Start assessment</span>
                    <ChevronRight size={16} />
                  </button>
                )}

                {item.status === "In progress" && (
                  <button
                    type="button"
                    className="asm-action-btn asm-btn-primary"
                    onClick={() => handleStartQuiz(item)}
                  >
                    <span>Continue test</span>
                    <ChevronRight size={16} />
                  </button>
                )}

                {item.status === "Graded" && (
                  <button
                    type="button"
                    className="asm-action-btn asm-btn-outline"
                    onClick={() => setReviewedAssessment(item)}
                  >
                    <span>View feedback</span>
                    <FileCheck size={16} />
                  </button>
                )}
              </div>
            </article>
          );
        })}

        {filteredAssessments.length === 0 && (
          <div className="materials-empty-state">
            <HelpCircle size={40} className="empty-icon-art" />
            <h3>No assessments matching criteria</h3>
            <p>Try switching filter tabs or clearing your search term.</p>
            <button
              type="button"
              className="reset-filters-btn"
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("All");
                setSelectedSubject("All");
              }}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Quiz Runner Modal */}
      {activeQuiz && (
        <div className="payment-modal-backdrop">
          <div className="quiz-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="quiz-modal-header">
              <div>
                <span className="quiz-header-badge">{activeQuiz.subject}</span>
                <h3 className="quiz-header-title">{activeQuiz.title}</h3>
                <p className="quiz-header-sub">
                  {activeQuiz.teacher} • {activeQuiz.duration} time limit
                </p>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setActiveQuiz(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {!quizSubmitted ? (
              <div className="quiz-modal-body">
                {/* Timer and Progress Track */}
                <div className="quiz-status-bar">
                  <div className="quiz-timer">
                    <Timer size={16} />
                    <span>Time Remaining: <strong>54:20</strong></span>
                  </div>
                  <span className="quiz-q-count">
                    Question {currentQuestionIndex + 1} of {activeQuiz.questions?.length || 3}
                  </span>
                </div>

                {/* Active Question */}
                {activeQuiz.questions && activeQuiz.questions[currentQuestionIndex] && (
                  <div className="quiz-question-container">
                    <h4 className="quiz-question-text">
                      {activeQuiz.questions[currentQuestionIndex].question}
                    </h4>

                    <div className="quiz-options-list">
                      {activeQuiz.questions[currentQuestionIndex].options.map((opt, optIdx) => {
                        const isSelected = userAnswers[currentQuestionIndex] === optIdx;
                        return (
                          <button
                            key={opt}
                            type="button"
                            className={`quiz-option-btn ${isSelected ? "quiz-option-selected" : ""}`}
                            onClick={() => handleSelectOption(currentQuestionIndex, optIdx)}
                          >
                            <span className="option-letter">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="option-text">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Question Navigation Footer */}
                <div className="quiz-modal-footer">
                  <button
                    type="button"
                    className="quiz-nav-btn"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  >
                    Previous
                  </button>

                  <div className="quiz-pips-row">
                    {activeQuiz.questions?.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`quiz-pip ${idx === currentQuestionIndex ? "quiz-pip-current" : userAnswers[idx] !== undefined ? "quiz-pip-answered" : ""}`}
                        onClick={() => setCurrentQuestionIndex(idx)}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  {currentQuestionIndex < (activeQuiz.questions?.length || 3) - 1 ? (
                    <button
                      type="button"
                      className="quiz-nav-btn quiz-nav-next"
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="quiz-nav-btn quiz-nav-submit"
                      onClick={handleSubmitQuiz}
                    >
                      <Send size={15} />
                      <span>Submit paper</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="payment-modal-body modal-center-body">
                <div className="success-icon-wrap">
                  <CheckCircle2 size={54} />
                </div>
                <h4>Assessment Submitted Successfully!</h4>
                <p>
                  Your responses have been recorded and sent to {activeQuiz.teacher} for grading.
                </p>
                <button
                  type="button"
                  className="confirm-pay-btn"
                  onClick={() => setActiveQuiz(null)}
                >
                  Return to assessments
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Feedback Modal */}
      {reviewedAssessment && (
        <div className="payment-modal-backdrop" onClick={() => setReviewedAssessment(null)}>
          <div className="payment-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal-head">
              <div>
                <h3>{reviewedAssessment.title}</h3>
                <p>{reviewedAssessment.subject} • {reviewedAssessment.teacher}</p>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setReviewedAssessment(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="payment-modal-body">
              <div className="score-highlight-card">
                <div>
                  <span>Final Result</span>
                  <strong className="score-huge">{reviewedAssessment.score}%</strong>
                </div>
                <span className="grade-badge-huge">Grade {reviewedAssessment.grade}</span>
              </div>

              <div className="teacher-feedback-box">
                <span className="feedback-label">Teacher&apos;s Feedback</span>
                <p>{reviewedAssessment.feedback}</p>
              </div>

              <button
                type="button"
                className="confirm-pay-btn"
                onClick={() => setReviewedAssessment(null)}
              >
                Close feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
