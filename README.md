# CV Evolution

A local CV evaluation dashboard for defining job requirements, uploading candidate CVs, evaluating and ranking candidates against those requirements, generating candidate-specific interview questions, and saving manager decisions.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB (with a memory fallback for local dev when Mongo is unavailable)
- AI: OpenRouter chat completions API with criteria-based local scoring and question generation fallback

## Local development

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173.

If your local ports are already occupied, the backend will automatically retry on the next free port. The frontend can be pointed at the active backend by setting `VITE_API_URL=http://localhost:<active-port>` in the frontend shell, and the app also falls back to a local `/api` proxy for the default dev setup.

For OpenRouter-powered evaluation, candidate chat, and interview questions, set `OPENROUTER_API_KEY` in `backend/.env` and restart the backend. Optionally set `OPENROUTER_MODEL` (default: `openai/gpt-4o-mini`). The key stays server-side. Requests use OpenRouter's OpenAI-compatible chat completions API. Candidate chat history is saved by this application against its candidate and job. The Settings page reports whether the backend detected configuration; provider request failures are shown instead of silently switching providers.

The Settings page offers three workspace themes: Obsidian + Emerald, Midnight + Violet, and Warm Ivory + Forest. The selected theme and desktop sidebar state are saved in browser local storage and apply across the dashboard and public job application pages.

## Production-like setup

```bash
docker-compose up -d --build
```

## API base

- http://localhost:5003/api
- The backend retries to the next free port automatically if 5001/5002/5003 are already in use.

## Core routes

- POST /api/jobs
- PUT /api/jobs/:jobId (update job details, branding, and application questions)
- POST /api/jobs/:jobId/logo (upload a company logo)
- POST /api/cvs/:jobId/upload (HR batch CV upload)
- POST /api/cvs/:jobId/apply (candidate application)
- DELETE /api/cvs/:jobId/candidates/:candidateId (delete applicant and associated records/documents)
- GET /api/jobs/:jobId/candidates/filtered
- POST /api/evaluations
- POST /api/evaluations/:jobId/analyze
- POST /api/evaluations/:jobId/match
- POST /api/evaluations/:jobId/questions
- GET, POST /api/evaluations/:jobId/candidates/:candidateId/chats (list/create chat threads)
- GET, POST /api/evaluations/:jobId/candidates/:candidateId/chats/:conversationId (load/send chat messages)
- DELETE /api/evaluations/:jobId/candidates/:candidateId/chats/:conversationId (delete a saved chat thread)
- POST /api/jobs/:jobId/image (optional JPEG, PNG, WebP, or GIF role image)
- GET /api/jobs/:jobId/ranking
- POST /api/feedback
- GET /api/jobs/:jobId/dashboard

Use the **Job Link** page to create or edit a job, format its description, set required skills and qualifications, upload a company logo, and build the candidate application form. Public `/apply/:jobId` links show the company and job details first, followed by the saved application form on the same page; the apply button scrolls applicants to the form. The application UI uses a white and light-blue palette. The form supports required or optional questions, dropdowns, and document uploads. Applicants' CVs will be evaluated and added to Rankings automatically. Existing jobs created before form customization keep the default name, contact, CV, certificate, and KUR fields.

The **Ranking Page** also supports HR batch CV upload and visibly coordinates requirement-based analysis and matching, ranking, and candidate-specific interview-question generation; it opens Results only after every step succeeds. Generated evaluations and interview questions are persisted against each job and candidate, so Results and Questions & Interviews can reload completed data without repeating analysis. HR can delete an applicant and their associated documents, evaluations, decisions, questions, and saved chats. Candidate-scoped chat history supports multiple saved conversations per job and applicant; suggested prompts and generated interview questions are saved in their chat thread, along with AI replies. Generated questions are presented as a document on Questions & Interviews, divided into Hard Questions and Interview Questions, with a downloadable copy for each candidate.

The **Job Link** builder saves the public job description and application fields together. The `/apply/:jobId` page renders the saved fields as the candidate's actual form, and open public pages refresh when a saved job is updated in another tab or when the page becomes active again.
