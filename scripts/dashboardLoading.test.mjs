import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
function load(failures=[]) {
  const result={getUpcomingClasses:[{id:"s",batchId:"allowed"}],getRecentMaterials:[{id:"m",batchId:"allowed"}],getAnnouncements:[{id:"a",batchId:"allowed"}],getStudentProfile:{name:"Student"},getAvailableBatches:[{id:"allowed",status:"AVAILABLE"}],getMyEnrollmentStatuses:[{batchId:"allowed",status:"APPROVED"}]};
  const dependencies=new Proxy({}, {get:(_,name)=>async()=>{if(failures.includes(name)) throw new Error("Unavailable"); return result[name];}});
  const code=ts.transpileModule(fs.readFileSync(new URL("../src/services/dashboardService.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const compiled={exports:{}};
  vm.runInNewContext(code,{module:compiled,exports:compiled.exports,require:id=>id==="@/lib/schedules"?{upcomingOccurrences:items=>items}:dependencies,Date});
  return compiled.exports.loadStudentDashboard;
}
test("one failed dashboard section reports the failure and retains the successful sections",async()=>{
  const data=await load(["getUpcomingClasses"])();
  assert.ok(data.failures.includes("Schedule"));assert.equal(data.classes.length,0);assert.equal(data.resources.length,1);assert.equal(data.profile.name,"Student");assert.equal(data.batches[0].status,"APPROVED");
});
test("access verification failure clears private content and marks dependent sections unavailable",async()=>{
  const data=await load(["getMyEnrollmentStatuses"])();
  for(const section of ["Class access","Schedule","Materials","Announcements","Classes"]) assert.ok(data.failures.includes(section));
  for(const key of ["classes","resources","announcements","batches"])assert.equal(data[key].length,0);
});
test("total failure produces explicit errors and a retry can recover real data",async()=>{
  const failed=await load(["getUpcomingClasses","getRecentMaterials","getAnnouncements","getStudentProfile","getAvailableBatches","getMyEnrollmentStatuses"])();
  assert.equal(failed.failures.length,6);
  const recovered=await load()();assert.equal(recovered.failures.length,0);assert.equal(recovered.classes.length,1);
});
