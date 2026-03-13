# Task Manager

A modern, full-stack task management application built with React, TypeScript, Node.js, and PostgreSQL. Features a clean, responsive UI with board-based project management and user authentication.

![TaskManager Screenshot](docs/screen1.png)

## 🚀 Features

- **Firebase Authentication**: Secure Google sign-in + token-based API auth with automatic token refresh
- **Dashboard**: Overview of all user boards with quick access
- **Kanban Boards**: Drag-and-drop interface for organizing tasks into columns
- **Board Management**: Create and manage multiple project boards
- **Card Management**: Create, edit, and organize task cards with metadata
- **Tag System**: Color-coded tags for categorizing cards
- **Advanced Features**: Effort estimation, priority levels, due dates
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: Live synchronization across devices
- **Docker Support**: Containerized deployment
- **API Documentation**: Interactive Swagger UI at /docs

## 🛠 Tech Stack

**Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router, React Query  
**Backend**: Node.js, Hono, TypeScript, PostgreSQL, Vitest, OpenAPI  
**DevOps**: Docker, ESLint, npm workspaces

## 🚀 Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd taskmanager
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Then edit .env and provide Firebase credentials (see below)
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

#### Firebase configuration

This project uses Firebase Authentication (Google sign-in) on the frontend and Firebase Admin on the backend.

In `.env` you should set your Firebase Web app values:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

And for backend verification, provide either a service account JSON (recommended) or a project ID:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-service-account.json
# or
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":...}'
# or (GCP only)
FIREBASE_PROJECT_ID=...
```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/docs

### Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start PostgreSQL** (via Docker)
   ```bash
   docker-compose up postgres -d
   ```

3. **Start development servers**
   ```bash
   npm run dev  # Starts both frontend and backend
   ```

## 🧪 Testing

The backend uses Vitest for unit and integration testing.

To run integration tests:

```bash
npm run test --workspace=apps/backend
```

To run tests with coverage:

```bash
npm run test:coverage --workspace=apps/backend
```

## 📄 License

This project is licensed under the MIT License.</content>
