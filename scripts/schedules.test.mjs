import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
const code=ts.transpileModule(fs.readFileSync(new URL("../src/lib/schedules.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const compiled={exports:{}};vm.runInNewContext(code,{module:compiled,exports:compiled.exports,Date,Intl});
const {colomboDateKey,getWeekDays,occurrencesForWeek,upcomingOccurrences}=compiled.exports;
const now=new Date("2026-11-23T04:00:00Z");
const definition={id:"monday",batchId:"batch",title:"Physics",dayOfWeek:"MONDAY",effectiveDate:"2026-11-23",recurrence:"WEEKLY",startTime:"09:00:00",endTime:"10:00:00",mode:"ONLINE"};
test("canonical backend schedule matches Monday and includes Sunday's real calendar date",()=>{
  assert.equal(colomboDateKey(new Date("2026-11-22T20:00:00Z")),"2026-11-23");
  const days=getWeekDays(now);assert.equal(days.length,7);assert.equal(days[0].dateKey,"2026-11-23");assert.equal(days[6].dateKey,"2026-11-29");
  assert.equal(occurrencesForWeek([definition],now)[0].day,"Mon");
  assert.equal(occurrencesForWeek([{...definition,dayOfWeek:"SUNDAY"}],now)[0].dateKey,"2026-11-29");
});
test("week navigation crosses months and years without using the browser timezone",()=>{
  assert.equal(getWeekDays(now,1)[0].dateKey,"2026-11-30");assert.equal(getWeekDays(now,-1)[0].dateKey,"2026-11-16");
  assert.equal(getWeekDays(new Date("2026-12-31T20:00:00Z"),1)[0].dateKey,"2027-01-04");
});
test("ONCE and BI_WEEKLY honor the effective date and never recur early",()=>{
  assert.equal(occurrencesForWeek([definition],now,-1).length,0);
  const once={...definition,recurrence:"ONCE"};assert.equal(occurrencesForWeek([once],now).length,1);assert.equal(occurrencesForWeek([once],now,1).length,0);
  const biweekly={...definition,recurrence:"BI_WEEKLY"};assert.equal(occurrencesForWeek([biweekly],now,1).length,0);assert.equal(occurrencesForWeek([biweekly],now,2)[0].dateKey,"2026-12-07");
});
test("upcoming sorts real times, retains ongoing classes and rolls ended recurrence forward",()=>{
  const classes=[{...definition,id:"ended",startTime:"08:00",endTime:"09:00"},{...definition,id:"later",startTime:"11:00",endTime:"12:00"},definition];
  assert.equal(upcomingOccurrences(classes,now,2).map(item=>item.id).join(","),"monday,later");
  assert.equal(upcomingOccurrences([definition],new Date("2026-11-23T04:30:00Z"),1)[0].dateKey,"2026-11-30");
  assert.equal(upcomingOccurrences([{...definition,recurrence:"ONCE"}],new Date("2026-11-23T04:30:00Z")).length,0);
});
test("invalid definitions cannot invent dates, recurrences or delivery modes",()=>{
  for(const change of [{effectiveDate:"2026-02-30"},{dayOfWeek:"INVALID"},{startTime:"25:00"},{recurrence:"MONTHLY"},{mode:"UNKNOWN"}]) assert.equal(occurrencesForWeek([{...definition,...change}],now).length,0);
  assert.equal(occurrencesForWeek([{...definition,mode:"HYBRID"}],now)[0].mode,"Hybrid");
  assert.equal(occurrencesForWeek([{...definition,mode:"IN_PERSON"}],now)[0].mode,"In person");
});
