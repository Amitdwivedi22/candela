# Candela 📋

> AI-powered, multi-domain portfolio and project brief generator for students.

## What it does

Candela turns a student's university syllabus into real-world projects, case studies, and engineering problems that hiring managers can actually review. Instead of just sending out resumes, students can build verifiable, market-standard portfolios. 

Candela supports four distinct academic domains, each with tailored UI, inputs, and AI prompt scaffolding:
1. **Tech & Software**: Generate full-stack projects, CLIs, and APIs.
2. **Commerce**: Generate real-world case studies and Excel financial models.
3. **Engineering**: Solve real design problems with calculation scaffolds and physics checkpoints.
4. **Medical**: Practice diagnostic skills with realistic clinical case presentations.

The brief is generated in real-time using Google Gemini 2.0 Flash. Students can input their constraints manually or upload their actual course syllabus (PDF/TXT) to ensure the AI generates highly accurate, curriculum-aligned tasks. 

## Features

- **Multi-Domain Architecture:** Dedicated dashboards and custom generation logic for Tech, Commerce, Engineering, and Medical students.
- **Syllabus Parsing:** Upload course PDFs via the built-in parser to generate highly relevant content.
- **Dynamic AI Generation:** Real-time generation of custom assignments via Google Gemini API, utilizing domain-specific instructional prompt chains.
- **Authentication & Persistence:** Secure login with Credentials and Google OAuth (via Firebase Client bridging to NextAuth). All generated briefs, profiles, and domains are saved in MongoDB.
- **Interactive Refinement:** Conversational chat interface to refine the generated brief if it's too hard or too easy.
- **PDF Export:** One-click download of your project brief as a beautifully formatted PDF.
- **Modern UI:** Built with Tailwind CSS, Framer Motion, and a cohesive, premium dark-mode design system.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS & Framer Motion
- **Database:** MongoDB & Mongoose
- **Authentication:** Firebase Auth (Client) + NextAuth (Server/Session)
- **AI Model:** Google Gemini 2.0 Flash (via `@google/genai`)
- **Document Parsing:** `pdf-parse`
- **Exporting:** `jspdf` for PDF generation

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

### 3. Setup Environment Variables
Create a `.env` and `.env.local` file in the root directory and add your API keys:

**`.env`**
```env
GEMINI_API_KEY="your_google_gemini_api_key"
NEXTAUTH_SECRET="your_nextauth_secret"
```

**`.env.local`**
```env
MONGODB_URI="your_mongodb_connection_string"
NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_firebase_auth_domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_firebase_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_firebase_storage_bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_firebase_messaging_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_firebase_app_id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your_firebase_measurement_id"
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
│   ├── (auth)/             # Login and signup routes (Firebase + NextAuth)
│   ├── api/                # Next.js API Routes (Briefs, Gemini, Auth, PDF Parsing)
│   ├── dashboard/          # Domain-agnostic routing and dashboard home
│   │   ├── commerce/       # Commerce vertical dashboard
│   │   ├── engineering/    # Engineering vertical dashboard
│   │   ├── medical/        # Medical vertical dashboard
│   │   └── select-domain/  # Profile setup route
│   ├── layout.tsx          # Root layout and global providers
│   └── page.tsx            # Multi-domain Landing page
├── components/             # Reusable UI Components
│   ├── commerce/           # Commerce-specific forms and displays
│   ├── engineering/        # Engineering-specific forms and displays
│   ├── medical/            # Medical-specific forms and displays
│   ├── BriefDisplay.tsx    # Renders the tech brief, handles PDF export
│   └── BriefForm.tsx       # Tech-specific input constraints
├── lib/                    # Configuration and Utilities
│   ├── auth.ts             # NextAuth configuration and Firebase Credential Provider
│   ├── firebase.ts         # Firebase Client SDK initialization
│   ├── prompts/            # Domain-specific Gemini prompt builders
│   └── mongodb.ts          # MongoDB connection handler
├── models/                 # Mongoose Database Schemas
│   ├── Brief.ts            # Multi-domain brief schema
│   └── User.ts             # User profile and domain schema
└── public/                 # Static assets
```
