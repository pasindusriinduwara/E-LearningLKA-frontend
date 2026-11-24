import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function classroomHarness({ status = "APPROVED", batchError, contentError } = {}) {
  let currentStatus = status;
  const calls = [];
  const service = (name, result) => async (...args) => {
    calls.push({ name, args });
    if (contentError) throw contentError;
    return result;
  };
  const dependencies = {
    "@/services/batchService": { getBatchById: async (id) => {
      calls.push({ name: "batch", args: [id] });
      if (batchError) throw batchError;
      return { id, status: currentStatus };
    } },
    "@/services/studentService": {
      getBatchMaterials: service("materials", [{ id: "material" }]),
      getBatchAnnouncements: service("announcements", [{ id: "announcement" }]),
      getBatchSchedules: service("schedules", [{ id: "schedule" }]),
    },
    "@/services/assessmentService": {
      assessmentService: { getBatchAssessments: service("assessments", [{ id: "assessment" }]) },
    },
  };
  const source = fs.readFileSync(new URL("../src/services/classroomService.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
  } }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(code, {
    module: compiled, exports: compiled.exports, Error,
    require(id) { assert.ok(id in dependencies, `Unexpected import: ${id}`); return dependencies[id]; },
  });
  return { ...compiled.exports, calls, setStatus(next) { currentStatus = next; } };
}

for (const status of ["PENDING", "REJECTED", "AVAILABLE", undefined]) {
  test(`classroom does not request private content without explicit approval (${status})`, async () => {
    const app = classroomHarness();
    app.setStatus(status);
    await assert.rejects(app.getStudentClassroom("biology", "student"), /approve|access/i);
    assert.deepEqual(app.calls.map(({ name }) => name), ["batch"]);
  });
}

test("approved classroom loads content for the requested batch and student after checking access", async () => {
  const app = classroomHarness();
  const classroom = await app.getStudentClassroom("biology", "student");
  assert.equal(classroom.batch.status, "APPROVED");
  assert.equal(classroom.materials[0].id, "material");
  assert.equal(classroom.announcements[0].id, "announcement");
  assert.equal(classroom.schedules[0].id, "schedule");
  assert.equal(classroom.assessments[0].id, "assessment");
  assert.deepEqual(app.calls.map(({ name }) => name), ["batch", "materials", "announcements", "schedules", "assessments"]);
  assert.deepEqual(app.calls.at(-1).args, ["biology", "student"]);
});

test("access refresh checks current approval again after a teacher revokes access", async () => {
  const app = classroomHarness();
  await app.getStudentClassroom("biology", "student");
  app.setStatus("REJECTED");
  await assert.rejects(app.getApprovedClassroomBatch("biology"), /do not have access/);
  await assert.rejects(app.getStudentClassroom("biology", "student"), /do not have access/);
  assert.equal(app.calls.filter(({ name }) => name === "materials").length, 1);
  app.setStatus("APPROVED");
  assert.equal((await app.getStudentClassroom("biology", "student")).batch.status, "APPROVED");
  assert.equal(app.calls.filter(({ name }) => name === "materials").length, 2);
});

test("failed access verification cannot fall through to classroom content", async () => {
  const app = classroomHarness({ batchError: new Error("Access check unavailable") });
  await assert.rejects(app.getStudentClassroom("biology", "student"), /Access check unavailable/);
  assert.deepEqual(app.calls.map(({ name }) => name), ["batch"]);
});

test("content permission failures propagate so the page can clear previously displayed content", async () => {
  const app = classroomHarness({ contentError: new Error("Teacher revoked access") });
  await assert.rejects(app.getStudentClassroom("biology", "student"), /Teacher revoked access/);
});
