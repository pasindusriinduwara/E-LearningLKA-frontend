import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/lib/utils/quizParser.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
} }).outputText;
const compiledModule = { exports: {} };
vm.runInNewContext(code, { module: compiledModule, exports: compiledModule.exports });
const { parseQuizTextLocally, SAMPLE_EXAM_TEXT } = compiledModule.exports;
const plain = (value) => JSON.parse(JSON.stringify(value));
const choices = (question) => plain(question.options.map(({ label, text }) => ({ label, text })));
const expectedPlanets = [
  { label: "A", text: "Venus" }, { label: "B", text: "Jupiter" },
  { label: "C", text: "Mars" }, { label: "D", text: "Saturn" },
];

test("two-column PDF rows preserve all four choices and their canonical order", () => {
  for (const separator of ["\t", "  ", "          "]) {
    const [question] = parseQuizTextLocally(`1. Which planet is known as the Red Planet?\nA. Venus${separator}B. Jupiter\nC. Mars${separator}D. Saturn`);
    assert.deepEqual(choices(question), expectedPlanets);
    assert.equal(question.hasCorrectAnswer, false);
    assert.equal(question.options.some((option) => option.isCorrect), false);
  }
});

test("column-first extraction is reordered without losing option text or the answer", () => {
  const [question] = parseQuizTextLocally("1. Which planet is known as the Red Planet?\nA. Venus\nC. Mars\nB. Jupiter\nD. Saturn\nAnswer: C");
  assert.deepEqual(choices(question), expectedPlanets);
  assert.equal(question.options.find((option) => option.isCorrect)?.label, "C");
});

test("parenthesized inline choices and collapsed complete rows can be separated", () => {
  for (const row of ["(A) Venus (B) Jupiter (C) Mars (D) Saturn", "A) Venus B) Jupiter C) Mars D) Saturn", "A. Venus B. Jupiter C. Mars D. Saturn"]) {
    const [question] = parseQuizTextLocally(`1. Which planet is known as the Red Planet?\n${row}`);
    assert.deepEqual(choices(question), expectedPlanets);
  }
});

test("single-column multiline choices keep ordinary letter references inside the option", () => {
  const [question] = parseQuizTextLocally("1. Choose the correct statement.\nA. Vitamin B. is essential\nfor a healthy body.\nB. A different statement\nC. Another statement\nD. Last statement");
  assert.equal(question.options.length, 4);
  assert.equal(question.options[0].text, "Vitamin B. is essential for a healthy body.");
  assert.equal(question.hasCorrectAnswer, false);
  assert.equal(question.options.some((option) => option.isCorrect), false);
});

test("question prose and references to answers never fabricate an answer key", () => {
  const questions = parseQuizTextLocally("1. Choose the correct answer for the problem.\nA. The phrase Answer: B appears in this explanation.\nB. Beta\nC. Gamma\nD. Delta\n\n2. A student asks which is correct.\nA. Alpha\nB. Beta\nC. Gamma\nD. Delta");
  assert.equal(questions.length, 2);
  for (const question of questions) {
    assert.equal(question.hasCorrectAnswer, false);
    assert.ok(question.options.every((option) => !option.isCorrect));
  }
  assert.ok(questions[0].options[0].text.includes("Answer: B"));
});

test("explicit and standalone complete answer keys select only their bounded labels", () => {
  const base = "1. Choose a planet.\nA. Venus\nB. Jupiter\nC. Mars\nD. Saturn\n\n2. Choose a shape.\nA. Square\nB. Circle\nC. Hexagon\nD. Triangle\n";
  for (const key of ["Answer Key: 1. C 2. B", "Answers:\n1) C\n2) B", "1-C, 2-B"]) {
    const questions = parseQuizTextLocally(base + key);
    assert.equal(questions.length, 2);
    assert.deepEqual(plain(questions.map((question) => question.options.find((option) => option.isCorrect)?.label)), ["C", "B"]);
  }
  const unkeyed = parseQuizTextLocally(base + "Answer Key: 1. Carbon 2. Beta");
  assert.ok(unkeyed.every((question) => !question.hasCorrectAnswer));
});

test("numeric option groups remain within their question and normalize to A through D", () => {
  const questions = parseQuizTextLocally("1. Which gas causes the greenhouse effect?\n1) Nitrogen\n2) Oxygen\n3) Carbon dioxide\n4) Argon\nAnswer: 3\n\n2. Which planet is red?\nA. Venus\nB. Jupiter\nC. Mars\nD. Saturn");
  assert.equal(questions.length, 2);
  assert.deepEqual(plain(questions[0].options.map((option) => option.label)), ["A", "B", "C", "D"]);
  assert.equal(questions[0].options.find((option) => option.isCorrect)?.text, "Carbon dioxide");
  assert.equal(questions[1].questionNumber, 2);
});

test("the existing sample retains five complete questions and all declared answers", () => {
  const questions = parseQuizTextLocally(SAMPLE_EXAM_TEXT);
  assert.equal(questions.length, 5);
  assert.deepEqual(plain(questions.map((question) => question.options.length)), [4, 4, 4, 4, 4]);
  assert.deepEqual(plain(questions.map((question) => question.options.find((option) => option.isCorrect)?.label)), ["B", "A", "A", "C", "B"]);
});
