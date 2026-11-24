import { test,expect,type BrowserContext,type APIResponse } from "@playwright/test";
const origin=process.env.E2E_BASE_URL || "http://127.0.0.1:3100";
const password="Test-password-2026!";
test.beforeAll(async({request})=>{
  if(process.env.E2E_ALLOW_WRITES!=="1") throw new Error("Run against an isolated test database and set E2E_ALLOW_WRITES=1.");
  const backend=process.env.E2E_BACKEND_URL || "http://127.0.0.1:18081";
  await expect.poll(async()=>{try{return (await request.get(`${backend}/actuator/health`,{timeout:3000})).status();}catch{return 0;}},{message:"The isolated backend must be healthy before browser acceptance",timeout:30_000}).toBe(200);
});
async function json(response:APIResponse) {
  expect(response.ok(),`${response.status()} ${await response.text()}`).toBeTruthy();return response.json();
}
async function mutate(context:BrowserContext,path:string,data:object,method="POST") {
  return context.request.fetch(`/api/backend${path}`,{method,headers:{Origin:origin},data});
}
async function register(context:BrowserContext,role:"TEACHER"|"STUDENT") {
  const email=`e2e-${role.toLowerCase()}-${crypto.randomUUID()}@example.test`;
  const body=await json(await context.request.post("/api/auth/register",{headers:{Origin:origin},data:{email,password,userType:role,firstName:role==="TEACHER"?"Test Teacher":"Test Student",lastName:"Journey",grade:"A/L",stream:"Science",medium:"English"}}));
  expect(body.token).toBeUndefined();
  return {email,profile:await json(await context.request.get("/api/backend/users/me"))};
}
test("teacher approval, schedule, essay grading/publication, private files, archive and restore",async({browser})=>{
  const teacher=await browser.newContext(),student=await browser.newContext(),stranger=await browser.newContext();
  try {
    await register(teacher,"TEACHER");const studentAccount=await register(student,"STUDENT");await register(stranger,"STUDENT");
    const subjects=await json(await teacher.request.get("/api/backend/subjects"));
    const batch=await json(await mutate(teacher,"/batches",{name:`E2E Physics ${Date.now()}`,examYear:"2027",subjectId:subjects[0].id,deliveryMode:"ONLINE"}));
    await json(await mutate(student,"/enrollments/request",{batchId:batch.id}));
    const page=await teacher.newPage();await page.goto("/teacher/enrollments");
    await page.getByRole("button",{name:/Allow access for Test Student/}).click();
    await expect.poll(async()=>{const statuses=await json(await student.request.get("/api/backend/enrollments/my-status"));return statuses.find((item:{batchId:string})=>item.batchId===batch.id)?.status;}).toBe("APPROVED");
    await page.goto(`/teacher/classes/${batch.id}`);
    await page.getByRole("button",{name:"Edit class",exact:true}).click();
    await page.getByLabel("Class name",{exact:true}).fill(`${batch.name} Updated`);
    await page.getByRole("button",{name:"Save class",exact:true}).click();
    await expect(page.getByRole("heading",{name:`${batch.name} Updated`,exact:true})).toBeVisible();
    const date=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Colombo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    await json(await mutate(teacher,"/teacher/schedules",{batchId:batch.id,title:"E2E live class",date,startTime:"22:00",endTime:"23:00",location:"Online classroom",mode:"ONLINE",repeat:"WEEKLY"}));
    const learner=await student.newPage();await learner.goto("/schedule");
    await expect(learner.getByRole("tab")).toHaveCount(7);await expect(learner.getByRole("heading",{name:"E2E live class"})).toBeVisible();
    const assessment=await json(await mutate(teacher,"/assessments/quiz",{batchId:batch.id,title:"E2E essay",assessmentType:"ESSAY",totalMarks:100,durationMinutes:60,dueDate:"2099-12-31T23:00:00",submissionType:"BOTH",questions:[],instructions:"Explain your solution."}));
    const pdf=Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF");
    const uploaded=await json(await student.request.post(`/api/backend/assessments/${assessment.id}/upload-answer`,{headers:{Origin:origin},multipart:{file:{name:"answer.pdf",mimeType:"application/pdf",buffer:pdf}}}));
    const submitted=await json(await mutate(student,`/assessments/${assessment.id}/submit-essay`,{studentId:studentAccount.profile.id,answerText:"The answer follows from conservation of energy.",paperUploadUrl:uploaded.url,fileName:"answer.pdf"}));
    const filePath=`/api/backend/assessments/files/${new URL(uploaded.url,"http://backend.test").pathname.split("/").pop()}`;
    expect((await student.request.get(filePath)).ok()).toBeTruthy();expect((await stranger.request.get(filePath)).ok()).toBeFalsy();
    await learner.goto("/assessments");await expect(learner.getByText("Awaiting results",{exact:true}).first()).toBeVisible();
    const submissionId=submitted.submissionId;
    await json(await mutate(teacher,`/assessments/${assessment.id}/submissions/${submissionId}/grade`,{scoreObtained:85,feedback:"Clear explanation."}));
    let own=await json(await student.request.get(`/api/backend/assessments/${assessment.id}/my-submission`));expect(own.scoreObtained).toBeNull();
    await page.goto("/teacher/results");await page.getByRole("combobox",{name:"Assessment",exact:true}).selectOption(assessment.id);
    await page.getByRole("button",{name:"Publish 1 result",exact:true}).click();await page.getByRole("button",{name:"Publish results",exact:true}).click();
    await expect.poll(async()=>{own=await json(await student.request.get(`/api/backend/assessments/${assessment.id}/my-submission`));return own.resultPublished;}).toBeTruthy();
    expect(Number(own.scoreObtained)).toBe(85);
    const notifications=await json(await student.request.get("/api/backend/notifications"));expect(notifications.items.some((item:{type:string})=>item.type==="RESULT_PUBLISHED")).toBeTruthy();
    await learner.reload();await expect(learner.getByText("Graded",{exact:true}).first()).toBeVisible();
    await learner.getByRole("button",{name:/Notifications,/}).click();await expect(learner.getByRole("dialog",{name:"Notifications"})).toBeVisible();
    await page.goto(`/teacher/classes/${batch.id}`);await page.getByRole("button",{name:"Archive class",exact:true}).click();await page.getByRole("button",{name:"Confirm archive",exact:true}).click();
    await expect(page.getByRole("button",{name:"Restore class",exact:true})).toBeVisible();
    expect((await student.request.get(filePath)).ok()).toBeFalsy();
    expect((await student.request.get(`/api/backend/assessments/${assessment.id}/take`)).ok()).toBeFalsy();
    const preserved=await json(await teacher.request.get(`/api/backend/results/${assessment.id}`));expect(preserved.submissions).toHaveLength(1);
    await page.getByRole("button",{name:"Restore class",exact:true}).click();await expect(page.getByRole("button",{name:"Archive class",exact:true})).toBeVisible();
    expect((await student.request.get(filePath)).ok()).toBeTruthy();
    expect((await mutate(stranger,`/batches/${batch.id}/status`,{active:false},"PATCH")).status()).toBe(403);
  } finally {await teacher.close();await student.close();await stranger.close();}
});
test("password change revokes other sessions and logout clears the active browser",async({browser})=>{
  const first=await browser.newContext(),second=await browser.newContext();
  try {
    const account=await register(first,"STUDENT");
    await json(await second.request.post("/api/auth/login",{headers:{Origin:origin},data:{email:account.email,password}}));
    const page=await first.newPage();await page.goto("/settings");
    await page.getByLabel("Current password",{exact:true}).fill(password);await page.getByLabel("New password",{exact:true}).fill("Replacement-password-2026!");await page.getByLabel("Confirm password",{exact:true}).fill("Replacement-password-2026!");
    await page.getByRole("button",{name:"Change password",exact:true}).click();await expect(page.getByText("Password changed.",{exact:false})).toBeVisible();
    expect((await second.request.get("/api/backend/users/me")).ok()).toBeFalsy();
    expect((await first.cookies()).some(cookie=>cookie.name==="lms_session")).toBeFalsy();
    await page.goto("/login");await page.locator('input[type="email"]').fill(account.email);await page.locator('input[type="password"]').fill("Replacement-password-2026!");await page.getByRole("button",{name:/Sign in/i}).click();
    await expect(page).toHaveURL(/\/dashboard$/);await page.getByRole("button",{name:/Sign out/}).click();await expect(page).toHaveURL(/\/login$/);
  } finally {await first.close();await second.close();}
});
test("dashboard and schedule failures offer retry without reporting an empty successful response",async({browser})=>{
  const context=await browser.newContext();
  try {
    await register(context,"STUDENT");const page=await context.newPage();
    await page.route("**/api/backend/schedules/upcoming",route=>route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({message:"Schedule temporarily unavailable"})}));
    await page.goto("/dashboard");await expect(page.getByRole("alert").first()).toContainText("Schedule");await expect(page.getByRole("button",{name:"Retry dashboard"})).toBeVisible();
    await page.goto("/schedule");await expect(page.getByRole("alert").filter({hasText:"Schedule temporarily unavailable"})).toBeVisible();
    await page.unroute("**/api/backend/schedules/upcoming");await page.getByRole("button",{name:"Retry schedule"}).click();await expect(page.getByText("No classes scheduled for this date.")).toBeVisible();
  } finally {await context.close();}
});

test("emailed reset links are single use and revoke existing sessions",async({browser,request})=>{
  test.skip(!process.env.E2E_MAIL_URL,"Set E2E_MAIL_URL to an isolated SMTP test inbox.");
  const context=await browser.newContext(),other=await browser.newContext();
  try {
    const account=await register(context,"STUDENT");
    await json(await other.request.post("/api/auth/login",{headers:{Origin:origin},data:{email:account.email,password}}));
    const page=await context.newPage();await page.goto("/forgot-password");await page.getByLabel("Email address",{exact:true}).fill(account.email);await page.getByRole("button",{name:"Send reset link"}).click();await expect(page.getByRole("status")).toContainText("If an active account");
    const mailURL=process.env.E2E_MAIL_URL!;let id="";
    await expect.poll(async()=>{const inbox=await json(await request.get(`${mailURL}/api/v1/messages`));id=inbox.messages.find((mail:{ID:string;To:{Address:string}[]})=>mail.To.some(to=>to.Address===account.email))?.ID || "";return id;}).not.toBe("");
    const mail=await json(await request.get(`${mailURL}/api/v1/message/${id}`));
    const decoded=String(mail.Text).replace(/=\r?\n/g,"").replace(/=3D/g,"=");
    const token=decoded.match(/reset-password#token=([A-Za-z0-9_-]{43})/)?.[1];expect(token).toBeTruthy();
    await page.goto(`/reset-password#token=${token}`);await page.getByLabel("New password",{exact:true}).fill("Recovered-password-2026!");await page.getByLabel("Confirm new password",{exact:true}).fill("Recovered-password-2026!");await page.getByRole("button",{name:"Reset password",exact:true}).click();await expect(page.getByRole("status")).toContainText("Password reset");
    expect((await other.request.get("/api/backend/users/me")).ok()).toBeFalsy();
    const replay=await request.post("/api/auth/reset-password",{headers:{Origin:origin},data:{token,password:"Replay-password-2026!"}});expect(replay.status()).toBe(400);
    await json(await context.request.post("/api/auth/login",{headers:{Origin:origin},data:{email:account.email,password:"Recovered-password-2026!"}}));
    const unknown=await request.post("/api/auth/forgot-password",{headers:{Origin:origin},data:{email:`unknown-${crypto.randomUUID()}@example.test`}});expect(unknown.status()).toBe(202);expect((await unknown.json()).message).toContain("If an active account");
  } finally {await context.close();await other.close();}
});
