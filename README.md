# Candela 📋

> AI-powered project brief generator for students.

## What it does

Candela takes a student's course name, current week, prior projects, preferred language, and desired difficulty, and generates a tailored four-section project brief (Problem, Starter Scaffold, Checkpoint Questions, Stretch Goal) in real-time using the Ollama API.

The brief is streamed directly to the dashboard, providing immediate feedback. If a student wants something harder, easier, or slightly different, they can use the built-in conversational "pushback" feature to refine the brief interactively.

## Features

- **Dynamic Brief Generation:** Real-time generation of custom coding assignments via Gemini 2.5 Flash.
- **Interactive Refinement (Pushback):** Conversational chat interface to refine the generated brief.
- **Authentication & Persistence:** Secure login with Credentials and Google OAuth (via NextAuth). All generated briefs and conversations are saved in MongoDB.
- **Dashboard:** Manage past briefs, update their status (Saved, In Progress, Completed, Abandoned), and revisit previous project ideas.
- **PDF Export:** One-click download of your project brief as a beautifully formatted PDF.
- **Modern UI:** Built with Tailwind CSS, framer-motion, and a cohesive dark-mode design system.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS & Framer Motion
- **Database:** MongoDB & Mongoose
- **Authentication:** NextAuth (Auth.js)
- **AI Model:** Ollama API
- **Exporting:** jsPDF for PDF generation

## Getting Started

To get a local copy up and running, follow these simple steps.

### 1. Clone the repository
```bash
git clone https://github.com/your-username/candela.git
cd candela
```

### 2. Install dependencies
Ensure you have Node.js installed, then run:
```bash
npm install
```

This project relies on several key dependencies:
- **`next`**: React framework for production
- **`next-auth`**: Authentication for Next.js applications
- **`mongoose`**: MongoDB object modeling tool
- **Ollama API**: Used for project brief generation and contextual chat
- **`framer-motion`**: Animation library for React
- **`jspdf`**: PDF document generation

### 3. Setup Environment Variables
Create a `.env` file in the root directory and add your API keys:
```env
OLLAMA_BASE_URL="https://ollama.com/api"
OLLAMA_MODEL="gpt-oss:120b"
OLLAMA_API_KEY="your_ollama_api_key"
AUTH_SECRET="your_nextauth_secret"
MONGODB_URI="your_mongodb_connection_string"
GOOGLE_CLIENT_ID="optional_google_client_id"
GOOGLE_CLIENT_SECRET="optional_google_client_secret"
```

### 4. Start the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Project Structure

```text
candela/
├── app/
│   ├── (auth)/             # Authentication routes (login, signup)
│   ├── api/                # Next.js API Routes
│   │   ├── auth/           # NextAuth integration
│   │   ├── briefs/         # Brief creation and management endpoints
│   │   └── generate-brief/ # Gemini AI generation endpoint
│   ├── dashboard/          # User dashboard for brief management
│   ├── layout.tsx          # Root layout and global providers
│   └── page.tsx            # Landing page
├── components/             # Reusable UI Components
│   ├── BriefDisplay.tsx    # Renders the brief, handles PDF export and streams
│   ├── BriefForm.tsx       # Captures constraints (course, week, difficulty)
│   └── PushbackInput.tsx   # Chat interface for brief refinement
├── lib/                    # Utility functions and configurations
│   ├── auth.ts             # NextAuth configuration
│   └── mongodb.ts          # MongoDB connection handler
├── models/                 # Mongoose Database Schemas
│   ├── Brief.ts            # Project brief schema
│   └── User.ts             # User schema
└── public/                 # Static assets
```
