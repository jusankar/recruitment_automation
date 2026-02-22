# HireMatrixUI

Web application for recruiter, candidate, director, and admin workflows in Recruitment Automation.

## About
HireMatrixUI is a Next.js App Router application that integrates:
- `TalentMatchAI` for resume search
- `InterviewAIx` for interview lifecycle
- PostgreSQL (Prisma) for users, interviews, and applications

Role-based modules:
- Admin: user/database management
- Recruiter: upload resumes, search candidates, forward to interview
- Candidate: login, enter `interview_id`, answer questions
- Director: interview outcomes and metrics dashboard

## Architecture
1. Recruiter uploads resumes to TalentMatchAI
2. Recruiter searches candidates through TalentMatchAI
3. Recruiter forwards candidate to interview
   - InterviewAIx session started
   - Local DB rows updated (`Interview`, `Application`, `User`)
   - Candidate credentials generated
4. Candidate logs in and attends interview by `interview_id`
5. Director monitors interview results from UI API + DB

## Tech Stack
- Next.js 14 (App Router), React 18, TypeScript
- Tailwind CSS + shadcn/ui
- NextAuth credentials auth (JWT session strategy)
- Prisma + PostgreSQL
- Axios + Fetch
- Zustand

## Project Structure
```text
HireMatrixUI/
  app/
    api/
    admin/
    recruiter/
    candidate/
    director/
    login/
  components/
  prisma/schema.prisma
  lib/
  store/
  styles/
  package.json
```

## Environment Variables
Create `HireMatrixUI/.env`:

```env
NEXTAUTH_SECRET=replace_with_secure_secret
NEXTAUTH_URL=http://localhost:3000

NEXT_PUBLIC_TALENT_API=http://127.0.0.1:8000
NEXT_PUBLIC_INTERVIEW_API=http://127.0.0.1:8001

DATABASE_URL=postgresql://postgres:password@localhost:5432/interviewdb

# Optional
NEXT_PUBLIC_APP_VERSION=v1.0.0

# Optional webhook for candidate credentials email
CREDENTIAL_EMAIL_WEBHOOK_URL=
```

## Setup and Installation
1. Install dependencies
```bash
cd HireMatrixUI
npm install
```

2. Configure `.env`

3. Prepare database schema
```bash
npx prisma generate
npx prisma db push
```

4. Run development server
```bash
npm run dev
```

5. Open application
- `http://localhost:3000`

## Scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run db:generate`
- `npm run db:push`
- `npm run db:migrate`
- `npm run db:studio`

## Notes
- Candidate credentials are generated during recruiter "Forward to interview" action.
- If `CREDENTIAL_EMAIL_WEBHOOK_URL` is not configured, credentials are still generated and saved, but email sending is skipped.
- Speech recognition depends on browser Web Speech API support.
