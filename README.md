This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Completion features and verification

Student schedules use the current Sri Lankan calendar week, including Sunday, with
previous/next week navigation and correctly anchored weekly, biweekly and single
occurrences. Dashboard and schedule failures have visible retry states.

`/forgot-password` and `/reset-password` provide email recovery; both Settings pages
offer authenticated password changes. Deploy the matching backend and configure SMTP
and `APP_PUBLIC_URL`. Successful password changes revoke existing sessions.

Teacher class details include **Edit class**, **Archive class** and **Restore class**.
Archiving pauses student access while retaining existing work and enrollment records.

Run `npm run lint`, `npm test` and `npm run build`. Browser acceptance is available
through `npm run test:e2e`; it requires an isolated PostgreSQL-backed backend and
`E2E_ALLOW_WRITES=1`. See the workspace `DEPLOYMENT.md` for the complete setup and
optional SMTP inbox test. CI runs checks in this repository and full acceptance in
the workspace repository.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Teacher result publication

Open `/teacher/results`, select a batch and assessment, and review the student submissions.
Use **Grade submission** or **Review grade** to save marks and feedback privately, then
**Publish results** to release completed grades. Ungraded submissions stay private.
**Unpublish** hides the released results without deleting grades. Saving a revised grade
requires publishing that student's result again.

Students see **Awaiting results** after submitting. Once published, their own marks,
feedback and quiz review appear in Assessments and the class Results tab. Other students'
results are never returned by the student API. This page requires the backend result
publication endpoints and database migration `005_submission_result_publication.sql`
when automatic schema updates are disabled.

## Session and API deployment

Set `BACKEND_API_URL=http://localhost:8080` in the Next server environment (an optional
`/api/v1` suffix is accepted). Browser requests now use `/api/backend` and
`/api/auth`; JWTs stay in an expiring `HttpOnly`, `SameSite=Lax` cookie and are never
returned in browser JSON or stored in localStorage. Production cookies require
HTTPS. Existing users must sign in again after this upgrade. `NEXT_PUBLIC_API_URL`
and `NEXT_PUBLIC_API_BASE_URL` remain legacy backend configuration fallbacks, but
`BACKEND_API_URL` is preferred and is never bundled into browser JavaScript.

The proxy forwards credentials only to the configured backend and refuses upstream
redirects. State-changing requests require a matching `Origin`. When running behind
a reverse proxy with a different internal host, set `APP_ORIGIN` to the public
origin, for example `https://classroom.example`. Keep the backend network private
where possible. The in-memory backend login limiter sees the Next server IP; adjust
its IP limits for shared traffic and configure an edge/distributed limiter for
multiple application instances. Client-supplied forwarded IP headers are not trusted.

MCQ attempts start through `POST /api/v1/assessments/{id}/start` and resume the same
server deadline. Refreshing or reopening cannot restart the timer. The UI uses
`expiresAt` and `serverTime` with a monotonic clock, locks answers at expiry and
auto-submits. The backend permits only a fixed 15-second submission transport grace.
Assessment due dates use `Asia/Colombo`; attempt timestamps are UTC ISO instants.
Apply backend migrations `006_server_timed_quiz_attempts.sql` and
`007_announcement_author.sql` when automatic schema updates are disabled.

New student answer sheets use authenticated backend storage rather than public
Cloudinary URLs. Mount the backend upload directory on a persistent private volume.
Already published Cloudinary assets need a separate migration/removal at the storage
provider; changing the application cannot revoke their old public URLs.

## Teacher and student notifications

Both portals share an authenticated notification bell with a real unread count,
paginated history, individual read actions and **Mark all as read**. Opening the
bell refreshes the list; unread counts refresh while the tab is visible and when
the window regains focus. Loading, empty and retry states use the backend response;
there are no sample notifications. Notifications persist per account across devices.

Teachers receive enrollment requests and first assessment submissions. Students
receive enrollment decisions, available assessments, published results, batch
announcements, new materials and schedule changes. Private grades are never included
in notifications. Opening an item marks it read and navigates to its relevant page.
Classroom links support validated `?tab=announcements`, `results`, `assignments`,
`schedule` and `recordings` deep links.

The frontend uses `/api/backend/notifications` through the existing HttpOnly session
proxy; it sends no recipient IDs. Deploy the matching backend and apply migration
`008_notifications.sql` when automatic schema updates are disabled. Notifications
cover new activity after deployment; previous activity is not backfilled.

## Teacher-controlled student access

Open **Student access** (`/teacher/enrollments`) to manage requests for your own
classes. Search or filter All, Pending, Allowed and Denied students. **Allow access**
approves or restores access; **Deny access** rejects requests or revokes existing
access. Decisions remain in the list so they can be changed later. Inactive classes
cannot grant access. The dashboard **Review** action and enrollment notifications
open this page. Student class discovery remains at `/enrollment`.

Deploy the matching backend for `GET /api/v1/enrollments/teacher/requests` and
`PUT /api/v1/enrollments/teacher/requests/{id}/access` with `{ "allowed": true|false }`.
Classroom content loads only after current approval is verified. An open classroom
rechecks access on focus and every 30 seconds while visible, clearing content and
closing its modals if access is lost. Backend authorization applies to every request.

Payments are temporarily disabled: the Fees page, payment controls and class prices
are removed. New classes use a zero legacy fee value. Existing billing records are
preserved, and the former invoice endpoint returns HTTP 410.
