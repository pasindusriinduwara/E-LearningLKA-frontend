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
const answerKeyHeader = /^(?:answer\s*key|answers|correct\s*answers|marking\s*scheme)\b\s*:?[\t ]*/i;

function answerKeyEntries(line: string): Array<[number, string]> {
  const entries: Array<[number, string]> = [];
  const rest = line.replace(
    /(?:^|[\s,;|]+)(\d{1,3})\s*[-.:=)]\s*[(\[]?([A-Ea-e1-5])[)\]]?(?=$|[\s,;|])/g,
    (_, number: string, label: string) => {
      entries.push([Number(number), normalizeLabel(label)]);
      return "";
    }
  );
  // The entire line must be a key. Never read the first letter of question prose.
  return /^[\s,;|]*$/.test(rest) ? entries : [];
}

function extractBottomAnswerKey(text: string): Record<number, string> {
  const keyMap: Record<number, string> = {};
  let inKeySection = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    const header = line.match(answerKeyHeader);
    if (header) inKeySection = true;
    const entries = answerKeyEntries(header ? line.slice(header[0].length) : line);
    // A lone "1. A" is ambiguous with a numeric choice; require a key header,
    // multiple pairs, or an unambiguous key separator for unheaded keys.
    if (inKeySection || entries.length > 1 || /^\d{1,3}\s*[-:=]/.test(line)) {
      for (const [number, label] of entries) keyMap[number] = label;
    }
  }
  return keyMap;
}

interface OptionMarker {
  label: string;
  rawLabel: string;
  index: number;
  end: number;
  strong: boolean;
}

/** Keep ordinary prose such as "Vitamin B. is essential" inside its option. */
function optionMarkers(line: string): OptionMarker[] {
  const candidates: OptionMarker[] = [];
  const pattern = /([(\[]?)([A-Ea-e1-5])([.)\]])(?=\s|$)/g;
  let match;
  while ((match = pattern.exec(line)) !== null) {
    if (match.index > 0 && !/\s/.test(line[match.index - 1])) continue;
    candidates.push({ label: normalizeLabel(match[2]), rawLabel: match[2],
      index: match.index, end: pattern.lastIndex,
      strong: match[1] !== "" || match[3] !== "." });
  }
  if (candidates[0]?.index !== 0) return [];
  const collapsedSequence = candidates.length >= 3 && candidates.every((marker, index) =>
    marker.label.charCodeAt(0) === candidates[0].label.charCodeAt(0) + index);
  return candidates.filter((marker, index) => index === 0 || marker.strong || collapsedSequence ||
    /(?:\t|[^\S\r\n]{2,})$/.test(line.slice(0, marker.index)));
}

function startsNumericOptions(lines: string[], index: number, markers: OptionMarker[]): boolean {
  if (markers[0]?.rawLabel !== "1") return false;
  if (markers[1]?.rawLabel === "2") return true;
  for (let next = index + 1; next < lines.length; next++) {
    if (lines[next].trim()) return optionMarkers(lines[next].trim())[0]?.rawLabel === "2";
  }
  return false;
}

/**
 * High-performance regex layout parser running 100% free locally
 */
export function parseQuizTextLocally(rawText: string): ParsedQuestion[] {
  if (!rawText || !rawText.trim()) return [];

  const bottomAnswerKey = extractBottomAnswerKey(rawText);
  const lines = rawText.split(/\r?\n/);
  const questions: ParsedQuestion[] = [];
  const questionRegex = /^(?:(?:Q|Question)\s*)?(\d{1,3})[.)]\s*(.*)/i;
  const inlineAnswerRegex = /^(?:Answer|Ans|Correct(?:\s+(?:Option|Answer))?)(?:\s*[:=-]\s*|\s+)[(\[]?([A-Ea-e1-5])[)\]]?\.?\s*$/i;

  let currentQuestion: ParsedQuestion | null = null;
  let currentOption: ParsedOption | null = null;
  let numericOptions = false;
  let blankBefore = false;

  for (let index = 0; index < lines.length; index++) {
    const trimmed = lines[index].trim();
    if (!trimmed) { blankBefore = true; continue; }
    if (answerKeyHeader.test(trimmed)) break;
    const keyEntries = answerKeyEntries(trimmed);
    if (currentQuestion?.options.length && (keyEntries.length > 1 ||
      (keyEntries.length === 1 && /^\d{1,3}\s*[-:=]/.test(trimmed)))) break;

    const ansMatch = trimmed.match(inlineAnswerRegex);
    if (ansMatch && currentQuestion) {
      const correctLabel = normalizeLabel(ansMatch[1]);
      for (const option of currentQuestion.options) {
        option.isCorrect = option.label === correctLabel;
      }
      currentQuestion.hasCorrectAnswer = currentQuestion.options.some((option) => option.isCorrect);
      numericOptions = false;
      blankBefore = false;
      continue;
    }

    const markers = optionMarkers(trimmed);
    const first = markers[0];
    const numeric = first && /^[1-5]$/.test(first.rawLabel);
    // A numeric choice run must begin with 1, 2; ordinary question numbers
    // must not be mistaken for options. A blank paragraph can end the run.
    const nextNumericChoice = numericOptions && numeric &&
      Number(first.rawLabel) === currentQuestion!.options.length + 1 &&
      !(blankBefore && currentQuestion!.options.length >= 2 &&
        Number(first.rawLabel) === currentQuestion!.questionNumber + 1);
    const numericStart = currentQuestion && currentQuestion.options.length === 0 &&
      startsNumericOptions(lines, index, markers);
    if (currentQuestion && first && (!numeric || nextNumericChoice || numericStart)) {
      for (let optionIndex = 0; optionIndex < markers.length; optionIndex++) {
        const marker = markers[optionIndex];
        currentOption = {
          label: marker.label,
          text: trimmed.slice(marker.end, markers[optionIndex + 1]?.index).trim(),
          isCorrect: false,
        };
        currentQuestion.options.push(currentOption);
      }
      numericOptions = Boolean(numeric);
      blankBefore = false;
      continue;
    }

    const qMatch = trimmed.match(questionRegex);
    if (qMatch) {
      if (currentQuestion) {
        finalizeLocalQuestion(currentQuestion, bottomAnswerKey);
        questions.push(currentQuestion);
      }
      currentQuestion = {
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        questionNumber: Number(qMatch[1]),
        questionText: qMatch[2].trim(),
        marks: 1,
        confidence: 1,
        hasCorrectAnswer: false,
        options: [],
      };
      currentOption = null;
      numericOptions = false;
      blankBefore = false;
      continue;
    }

    if (currentOption) currentOption.text += ' ' + trimmed;
    else if (currentQuestion) currentQuestion.questionText += ' ' + trimmed;
    blankBefore = false;
  }

  if (currentQuestion) {
    finalizeLocalQuestion(currentQuestion, bottomAnswerKey);
    questions.push(currentQuestion);
  }
  return questions.length ? questions : fallbackLocalSegmenter(rawText);
}

function finalizeLocalQuestion(
  q: ParsedQuestion,
  bottomAnswerKey: Record<number, string>
) {
  // PDF extraction may read a full column first: A, C, B, D.
  q.options.sort((left, right) => left.label.localeCompare(right.label));
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
