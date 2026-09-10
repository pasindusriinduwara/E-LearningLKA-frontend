export interface ParsedOption {
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface ParsedQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  marks: number;
  confidence: number;
  hasCorrectAnswer: boolean;
  options: ParsedOption[];
  warning?: string;
}

export interface QuizMetadata {
  title: string;
  batchId?: string;
  batchName?: string;
  dueDate: string;
  durationMinutes: number;
  totalMarks: number;
}

/**
 * Normalizes option labels like '1', 'a', 'A' into standard 'A', 'B', 'C', 'D', 'E'
 */
function normalizeLabel(label: string): string {
  const map: Record<string, string> = {
    "1": "A",
    "2": "B",
    "3": "C",
    "4": "D",
    "5": "E",
    a: "A",
    b: "B",
    c: "C",
    d: "D",
    e: "E",
  };
  return map[label] || label.toUpperCase();
}

/**
 * Extracts bottom answer key like:
 * "Answer Key: 1. A  2. C  3. D" or "1-B, 2-D, 3-A"
 */
function extractBottomAnswerKey(text: string): Record<number, string> {
  const keyMap: Record<number, string> = {};
  const regex = /(\d{1,3})\s*[-.:=)]\s*([A-Ea-e1-5])/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const qNum = parseInt(match[1], 10);
    const ans = normalizeLabel(match[2]);
    keyMap[qNum] = ans;
  }
  return keyMap;
}

/**
 * High-performance regex layout parser running 100% free locally
 */
export function parseQuizTextLocally(rawText: string): ParsedQuestion[] {
  if (!rawText || !rawText.trim()) return [];

  const bottomAnswerKey = extractBottomAnswerKey(rawText);
  const lines = rawText.split(/\r?\n/);
  const questions: ParsedQuestion[] = [];

  const questionRegex = /^(?:(?:Q|Question|QUESTION)\s*)?(\d{1,3})[\.\)]\s*(.*)/i;
  const optionRegex = /^[(\[]?([A-Ea-e1-5])[)\]\.]\s*(.*)/;
  const inlineAnswerRegex = /(?:Answer|Ans|Correct(?:\s+Option|\s+Answer)?)\s*[:\-]?\s*[(\[]?([A-Ea-e1-5])[)\]]?/i;

  let currentQuestion: ParsedQuestion | null = null;
  let currentOption: ParsedOption | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Stop if header for bottom answer key is encountered
    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith("answer key") ||
      lower.startsWith("answers:") ||
      lower.startsWith("marking scheme")
    ) {
      break;
    }

    // Inline answer check
    const ansMatch = trimmed.match(inlineAnswerRegex);
    if (ansMatch && currentQuestion) {
      const correctLabel = normalizeLabel(ansMatch[1]);
      for (const opt of currentQuestion.options) {
        if (opt.label === correctLabel) {
          opt.isCorrect = true;
          currentQuestion.hasCorrectAnswer = true;
        }
      }
      continue;
    }

    // Question start check
    const qMatch = trimmed.match(questionRegex);
    if (qMatch) {
      if (currentQuestion) {
        finalizeLocalQuestion(currentQuestion, bottomAnswerKey);
        questions.push(currentQuestion);
      }

      const qNum = parseInt(qMatch[1], 10);
      currentQuestion = {
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        questionNumber: qNum,
        questionText: qMatch[2].trim(),
        marks: 1,
        confidence: 1,
        hasCorrectAnswer: false,
        options: [],
      };
      currentOption = null;
      continue;
    }

    // Option start check
    const optMatch = trimmed.match(optionRegex);
    if (currentQuestion && optMatch) {
      const label = normalizeLabel(optMatch[1]);
      const text = optMatch[2].trim();

      currentOption = {
        label,
        text,
        isCorrect: false,
      };
      currentQuestion.options.push(currentOption);
      continue;
    }

    // Multiline continuation
    if (currentOption) {
      currentOption.text += " " + trimmed;
    } else if (currentQuestion) {
      currentQuestion.questionText += " " + trimmed;
    }
  }

  if (currentQuestion) {
    finalizeLocalQuestion(currentQuestion, bottomAnswerKey);
    questions.push(currentQuestion);
  }

  // Fallback if no questions matched standard pattern
  if (questions.length === 0) {
    return fallbackLocalSegmenter(rawText);
  }

  return questions;
}

function finalizeLocalQuestion(
  q: ParsedQuestion,
  bottomAnswerKey: Record<number, string>
) {
  if (!q.hasCorrectAnswer && bottomAnswerKey[q.questionNumber]) {
    const target = bottomAnswerKey[q.questionNumber];
    for (const opt of q.options) {
      if (opt.label === target) {
        opt.isCorrect = true;
        q.hasCorrectAnswer = true;
        break;
      }
    }
  }

  let confidence = 1.0;
  const warnings: string[] = [];

  if (q.options.length === 0) {
    confidence -= 0.5;
    warnings.push("No options detected");
  } else if (q.options.length < 3) {
    confidence -= 0.2;
    warnings.push(`Only ${q.options.length} options found`);
  }

  if (!q.hasCorrectAnswer) {
    confidence -= 0.3;
    warnings.push("No correct answer selected");
  }

  if (!q.questionText || q.questionText.length < 5) {
    confidence -= 0.3;
    warnings.push("Question prompt is very short");
  }

  q.confidence = Math.max(0.1, Math.min(1.0, confidence));
  if (warnings.length > 0) {
    q.warning = warnings.join(" • ");
  }
}

function fallbackLocalSegmenter(text: string): ParsedQuestion[] {
  const blocks = text.split(/\n\s*\n/).filter((b) => b.trim().length > 8);
  return blocks.map((block, idx) => ({
    id: `q_fb_${Date.now()}_${idx}`,
    questionNumber: idx + 1,
    questionText: block.trim(),
    marks: 1,
    confidence: 0.5,
    hasCorrectAnswer: false,
    warning: "Review layout: split from paragraph block",
    options: [
      { label: "A", text: "Option A", isCorrect: false },
      { label: "B", text: "Option B", isCorrect: false },
      { label: "C", text: "Option C", isCorrect: false },
      { label: "D", text: "Option D", isCorrect: false },
    ],
  }));
}

export const SAMPLE_EXAM_TEXT = `
1. Which of the following is the SI unit of electric current?
a) Volt
b) Ampere
c) Ohm
d) Coulomb
Answer: b

2. The derivative of sin(x) with respect to x is:
A) cos(x)
B) -cos(x)
C) tan(x)
D) -sin(x)
Answer: A

3. In classical mechanics, momentum is defined as the product of:
(A) Mass and velocity
(B) Force and time
(C) Mass and acceleration
(D) Velocity and energy
Answer: A

4. Which gas is predominantly responsible for the greenhouse effect on Earth?
1) Nitrogen
2) Oxygen
3) Carbon dioxide
4) Argon
Answer: 3

5. Solve for x in the equation: 2^(x+1) = 16
A) 2
B) 3
C) 4
D) 5
Answer: B
`.trim();
