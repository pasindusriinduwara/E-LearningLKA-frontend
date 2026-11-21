This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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
