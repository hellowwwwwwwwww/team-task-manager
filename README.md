<<<<<<< HEAD
# TaskFlow - Team Task Manager

Full-stack task management app with role-based access, built with React + Node.js + PostgreSQL.

## Features
- JWT Authentication (Signup/Login)
- Role-based access (Admin/Member)
- Project creation & team management
- Task creation, assignment, status tracking
- Kanban board + list view
- Dashboard with stats & overdue detection

## Project Structure
```
team-task-manager/
├── backend/         # Node.js + Express + PostgreSQL
└── frontend/        # React
```

## Local Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env: REACT_APP_API_URL=http://localhost:5000/api
npm start
```

## Deploy to Railway

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

### 2. Deploy Backend on Railway
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo → select `backend` as root directory
3. Add PostgreSQL plugin → Railway auto-sets `DATABASE_URL`
4. Add env var: `JWT_SECRET=your_secret_key`
5. Deploy → copy the backend URL

### 3. Deploy Frontend on Railway
1. New Service in same project → GitHub repo → select `frontend` as root directory
2. Add env var: `REACT_APP_API_URL=https://YOUR_BACKEND_URL/api`
3. Deploy

## API Endpoints

### Auth
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user

### Projects
- `GET /api/projects` - All accessible projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Project details + members
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add member by email
- `DELETE /api/projects/:id/members/:userId` - Remove member

### Tasks
- `GET /api/tasks/dashboard` - Stats + recent tasks
- `GET /api/tasks/project/:projectId` - Tasks by project
- `POST /api/tasks/project/:projectId` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
=======
# team-task-manager
>>>>>>> d38a380e49c98755bbab6e9553fbec9e07e1c23d
