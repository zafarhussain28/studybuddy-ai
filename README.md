# StudyBuddy AI

Your AI-Powered Study Companion. An AI-powered web application that helps students learn faster by providing AI chat, note summarization, quiz generation, and personalized study plans.

Built for the **Vibe Coding Masterclass Assessment**.



Live Application: https://studybuddy-ai-zeta.vercel.app/

## Project Structure
```
studybuddy-ai/
├── client/                 # React frontend powered by Vite
│   ├── src/                # UI Components and Pages
│   │   ├── api/            # Axios API calls
│   │   ├── components/     # Layouts (Sidebar, Header)
│   │   ├── pages/          # Chat, Summarizer, Quiz, Planner, Home
│   │   ├── App.jsx         # React Router setup
│   │   └── index.css       # Tailwind v4 & Glassmorphism styles
│   └── package.json
├── server/                 # Node.js Express backend
│   ├── controllers/        # API business logic and OpenRouter integration
│   ├── routes/             # Express API routing
│   ├── index.js            # Main server entry & middleware setup
│   └── package.json
├── Dockerfile              # Multi-stage containerization build
├── vercel.json             # Serverless deployment configuration
└── README.md
```

## Features

- **AI Tutor Chat**: Token-by-token streaming response.
- **Notes Summarizer**: Quick breakdowns of large text blocks.
- **Quiz Generator**: Turns notes into MCQs and short answers.
- **Study Planner**: Creates structured study schedules.

## API Documentation

All endpoints are hosted under `/api`.

### `POST /api/chat`
- **Description**: Conversational AI tutor using SSE Streaming.
- **Body**: `{ "messages": [{ "role": "user", "content": "Hello" }] }`
- **Response**: `text/event-stream` stream of Server-Sent Events.

### `POST /api/summarize`
- **Description**: Summarizes provided notes.
- **Body**: `{ "notes": "Long text here..." }`
- **Response**: `{ "success": true, "summary": "Markdown text" }`

### `POST /api/quiz`
- **Description**: Generates a quiz from notes.
- **Body**: `{ "notes": "Topic details here..." }`
- **Response**: `{ "success": true, "quiz": "Markdown text" }`

### `POST /api/planner`
- **Description**: Generates a study schedule.
- **Body**: `{ "subject": "Math", "date": "2026-12-01", "hours": "10" }`
- **Response**: `{ "success": true, "plan": "Markdown text" }`

## Deployment Guide

### Free AI Model
All AI features use the server-configured `google/gemma-4-31b-it:free` model through OpenRouter. The backend rejects models without the `:free` suffix and disables provider fallbacks; it does not switch models or providers when the free model is unavailable.

### Vercel Deployment (Recommended)
This project includes a `vercel.json` file optimized for Vercel deployment.
1. Push this repository to GitHub.
2. Log into [Vercel](https://vercel.com) and import the repository.
3. In the environment variables section, add `OPENROUTER_API_KEY` for the backend and set `VITE_API_URL=/api` for the frontend build. Do not expose the OpenRouter key as a `VITE_` variable.
4. Click Deploy. Vercel will automatically build the React app and route `/api/*` to the Express backend.

### Docker / AWS Deployment
A production-ready `Dockerfile` is included.
1. Build the image: `docker build -t studybuddy-ai .`
2. Run the image: `docker run -p 5000:5000 -e OPENROUTER_API_KEY=your_key studybuddy-ai`
3. You can push this image to AWS ECR and deploy via **AWS App Runner** or Elastic Beanstalk.

## Local Environment Setup
1. Duplicate `server/.env.example` to `server/.env` and add your OpenRouter API key.
2. Backend: `cd server` -> `npm install` -> `node index.js`
3. Frontend: `cd client` -> `npm install` -> `npm run dev`
