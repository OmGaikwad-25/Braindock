# PlacePrep - Placement Readiness Platform

A modern, full-stack placement preparation platform for Computer Engineering students with AI-powered study plans, mock interviews, progress tracking, and opportunity management.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Chart.js, React Router |
| Backend | Node.js, Express.js |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (JSON Web Tokens) + bcrypt |
| Styling | Vanilla CSS (modern dashboard design) |

## 📋 Features

- **🔐 Authentication** - JWT-based registration/login with role support (Student/Admin)
- **👤 Student Profile** - Skills, CGPA, target companies, career goals
- **📝 Initial Assessment** - Aptitude + Technical + Coding evaluation
- **🤖 AI Study Plan** - Personalized weekly preparation plan
- **✅ Daily Tasks** - Auto-assigned tasks with streak tracking
- **📋 Weekly Tests** - Timed MCQ tests with question bank
- **📈 Progress Tracking** - Charts (Line, Radar, Bar) for performance analytics
- **🎤 Mock Interview** - AI-powered chat interview with evaluation
- **💼 Opportunities** - Internship/placement/event listings with search & filters
- **📑 Reports** - Weekly/monthly performance reports with recommendations
- **⚙️ Admin Panel** - User management, system stats, role management
- **🌙 Dark Mode** - Toggle between light and dark themes
- **📱 Responsive** - Mobile-friendly dashboard layout

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE placement_platform;
\q
```

### 2. Backend Setup

```bash
cd server

# Configure database connection
# Edit .env file with your PostgreSQL credentials:
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/placement_platform"

# Install dependencies
npm install

# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Start server
npm run dev
```

Server runs on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs on `http://localhost:5173`

### 4. Access the App

1. Open `http://localhost:5173`
2. Create an account (Sign Up)
3. Complete your profile
4. Take the initial assessment
5. Start preparing! 🎯

## 📁 Project Structure

```
placement-platform/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/         # DashboardLayout
│   │   ├── context/            # AuthContext
│   │   ├── pages/              # 10 page components
│   │   ├── services/           # API service layer
│   │   └── styles/             # CSS design system
│   ├── index.html
│   └── vite.config.js
├── server/                     # Express Backend
│   ├── prisma/
│   │   └── schema.prisma       # Database schema (10 models)
│   ├── src/
│   │   ├── controllers/        # 9 controllers
│   │   ├── middleware/          # JWT auth middleware
│   │   ├── routes/             # 10 route files
│   │   ├── services/           # AI service
│   │   └── index.js            # Server entry
│   └── .env
└── README.md
```

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| User | id, name, email, password, role |
| StudentProfile | userId, branch, year, cgpa, skills, targetCompanies |
| Assessment | userId, score, aptitude, technical, coding |
| Task | title, type, difficulty, topic, points |
| UserTask | userId, taskId, status, assignedDate |
| Test | userId, score, answers, questions |
| Interview | userId, type, score, feedback, messages |
| Opportunity | company, role, type, description, skills |
| Report | userId, type, data, generatedAt |
| StudyPlan | userId, plan, weekNum |

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |
| GET/PUT | /api/profile | Get/Update profile |
| GET | /api/assessments/questions | Get assessment questions |
| POST | /api/assessments/submit | Submit assessment |
| GET | /api/tasks/daily | Get daily tasks |
| PUT | /api/tasks/:id/complete | Complete a task |
| GET | /api/tests/weekly | Get weekly test |
| POST | /api/tests/submit | Submit test answers |
| POST | /api/interviews/start | Start mock interview |
| POST | /api/interviews/:id/answer | Answer interview question |
| GET | /api/opportunities | List opportunities |
| POST | /api/reports/generate | Generate report |
| GET | /api/dashboard/stats | Dashboard statistics |
| GET | /api/dashboard/analytics | Full analytics data |
| GET | /api/admin/stats | Admin statistics |
| GET | /api/admin/users | List all users |

## 🎨 Design

- Modern dashboard UI inspired by Notion/Stripe/Linear
- CSS custom properties for easy theming
- Smooth animations and micro-interactions
- Dark mode with one-click toggle
- Fully responsive (mobile, tablet, desktop)
