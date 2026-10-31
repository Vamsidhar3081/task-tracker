# FlowTasks – Frontend

## Overview

FlowTasks is a full-stack task accountability system that helps users manage tasks, track delays, and monitor overdue work.

This frontend is a responsive dashboard where users create tasks, delay them with a reason, update them, and mark them as completed. Admins can manage users and see everyone's tasks. The dashboard also includes an **AI Assistant** that answers natural-language questions about tasks.

The app talks to a Node.js and MySQL backend API.

---

## Tech Stack

- React.js
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router
- react-datepicker, react-hot-toast
- react-markdown with remark-gfm (renders the assistant's answers)

---

## Features

- User registration and login
- Roles: **Admin** and **User** (admins create users, assign tasks and see all tasks)
- Create, update and delete tasks
- Delay tasks with a reason and a new date
- Task statuses: Ongoing, Delayed, Completed
- Overdue task detection
- Dashboard statistics (total, completed, delayed, overdue) calculated by the server across all tasks, not just the current page
- Pagination, search and filtering
- Responsive dashboard UI (table on desktop, cards on mobile)
- Task options menu (complete, edit, delay, delete)
- AI Assistant (see below)

---

## AI Task Assistant

The dashboard has an **AI Assistant** where users type a question in plain language, for example:

- Which tasks assigned to Mouser are overdue?
- Show me all tasks with more than 2 delays.
- How many tasks are there, and how many are completed, delayed and overdue?
- Why do tasks keep getting delayed?
- Which tasks are related to payment problems?
- Summarize why the dashboard task got delayed.

### What the user sees

- **Task questions:** matching tasks appear as cards with status, assignee, delay count and description.
- **Counts and statistics:** the assistant's written answer is shown, for example a list of totals.
- **Delay summaries and patterns:** a written summary, rendered as Markdown (tables, bullet points and bold text display properly).
- **Unclear names:** if a name is misspelled or ambiguous, the assistant asks for clarification instead of guessing.

### How it works

The frontend only sends the question to the backend and displays the response. All AI work happens in the backend:

1. A language model turns the question into structured filters and chooses a tool.
2. The backend validates those filters, applies the user's permissions in SQL, and runs the query.
3. The model turns the result into a short answer, and the frontend shows both the answer and the full task data.

For topic questions such as "related to payment problems", the backend also uses semantic search (embeddings) to find tasks by meaning.

### AI configuration

The AI key is used only by the backend. It must never be committed to GitHub or exposed as a `VITE_` frontend variable. Configure these variables in the backend hosting provider:

```env
OPENAI_API_KEY=your_groq_api_key
OPENAI_MODEL=openai/gpt-oss-120b
OPENAI_BASE_URL=https://api.groq.com/openai/v1
```

For local development, keep the same values in the backend `.env` file.

---

## Environment Variables

Create a `.env` file in the frontend folder:

```env
VITE_API_URL=http://localhost:5000/api/
```

For the deployed app, set `VITE_API_URL` in Vercel to your deployed backend URL:

```env
VITE_API_URL=https://your-backend-domain.com/api/
```

---

## Screenshots

### Dashboard
![Dashboard](./screenshots/Dashboard.png)

<!-- Add an AI Assistant screenshot, then uncomment this line:
### AI Assistant
![AI Assistant](./screenshots/AI-assistant.png)
-->

### Create Account
![Create Account](./screenshots/Create-account.png)

### Login
![Login](./screenshots/Login.png)

### Create Task
![Create Task](./screenshots/Create-new-task.png)

### Delay Task
![Delay Task](./screenshots/Delay-task.png)

### Update Task
![Update Task](./screenshots/Update-task.png)

### Task Options
![Task Options](./screenshots/Options.png)

---

## Installation

Clone the repository:

```bash
git clone https://github.com/Vamsidhar3081/task-tracker.git
```

Go to the project folder:

```bash
cd task-tracker
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The application will run at:

```
http://localhost:5173
```

---

## Backend API

This frontend connects to the FlowTasks backend API, which handles authentication, tasks, statistics and the AI assistant.

Backend repository:
https://github.com/Vamsidhar3081/flowtasks-backend

---

## Author

Vamsidhar Reddy Dandu