# HireMatrix Enterprise - Recruitment Automation SaaS

Production-grade SaaS UI for recruitment automation, integrating TalentMatchAI and InterviewAIx services.

## Features

### User Roles

- **Admin**: User management, database management
- **Recruiter**: Resume upload, TalentMatchAI dashboard, candidate processing
- **Candidate**: Interview interface with audio/video, transcript capture, real-time Q&A
- **Director**: InterviewAIx dashboard with analytics and results

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Authentication**: NextAuth.js (JWT)
- **Database**: PostgreSQL + Prisma ORM
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Charts**: Recharts
- **Video/Audio**: WebRTC + Web Speech API

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Environment variables configured (see `.env.local.example`)

## Setup

1. **Install dependencies**:
   ```bash
   yarn install
   ```

2. **Set up environment variables**:
   Create `.env.local` with:
   ```env
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   NEXT_PUBLIC_TALENT_API=http://localhost:8000
   NEXT_PUBLIC_INTERVIEW_API=http://localhost:8001
   DATABASE_URL=postgresql://user:password@localhost:5432/interviewdb
   ```

3. **Set up database**:
   ```bash
   yarn db:generate
   yarn db:push
   # Or use migrations:
   yarn db:migrate
   ```

4. **Run development server**:
   ```bash
   yarn dev
   ```

5. **Open browser**:
   Navigate to `http://localhost:3000`

## Project Structure

```
HireMatrixUI/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin pages
│   ├── candidate/         # Candidate pages
│   ├── director/          # Director pages
│   ├── recruiter/         # Recruiter pages
│   ├── api/               # API routes
│   └── login/             # Authentication
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── admin/            # Admin components
│   ├── recruiter/        # Recruiter components
│   ├── candidate/       # Candidate components
│   └── director/         # Director components
├── lib/                  # Utilities and configs
├── prisma/               # Database schema
├── store/                # Zustand stores
└── styles/               # Global styles
```

## API Integration

### TalentMatchAI Service
- **Base URL**: `NEXT_PUBLIC_TALENT_API`
- **Endpoints**:
  - `POST /upload` - Upload resume
  - `POST /search` - Search resumes by job description

### InterviewAIx Service
- **Base URL**: `NEXT_PUBLIC_INTERVIEW_API`
- **Endpoints**:
  - `POST /interview/start` - Start interview
  - `POST /interview/{id}/answer` - Submit answer

## Database Models

- **User**: Authentication and user management
- **Tenant**: Multi-tenancy support
- **Job**: Job postings
- **Application**: Candidate applications
- **Interview**: Interview sessions and results

## Development

- **Type checking**: `yarn type-check` (if added)
- **Linting**: `yarn lint`
- **Database Studio**: `yarn db:studio`

## Deployment

The project includes:
- Kubernetes deployment config (`k8s/deployment.yaml`)
- GitHub Actions workflow (`.github/workflows/deploy.yml`)

Ensure environment variables are set in your deployment environment.

## Notes

- Speech recognition uses Web Speech API (Chrome/Edge recommended)
- Video capture requires HTTPS in production
- Database migrations should be run before deployment
- Ensure TalentMatchAI and InterviewAIx services are running

## License

Proprietary - HireMatrix Enterprise
