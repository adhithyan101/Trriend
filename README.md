# CO-RESOLVE — AI-Powered Crisis Response Platform

CO-RESOLVE is an AI-powered cooperative crisis-response platform designed for rapid disaster coordination. It pairs real-world crisis reports with relevant aid resources, volunteer capabilities, and organizational support using vector semantic search and structured multi-agent triage workflows.

---

## 1. System Architecture

```
React Frontend (Vite + Tailwind CSS)
      ↓
Python Authentication Layer (Python 3.14 + SQLite PBKDF2 Auth)
      ↓
Node.js Express Backend (Port 5000)
      ↓
SQLite Relational DB + Qdrant Vector Search + OpenAI Agents SDK
```

---

## 2. Key Features

- **Anonymous Crisis Reporting**: Victims and witnesses can report emergency needs immediately without creating an account or logging in.
- **Role-Based Authentication**: Volunteers and Organizations register and authenticate securely via the Python authentication service (`Backend/auth_service.py`).
- **Multi-Select Crisis Types & Requirements**: Supports multi-select emergency categories (*Flood, Fire, Medical Emergency, Evacuation, Food Shortage, Water Shortage, Search & Rescue, Shelter*) and multi-select capability requirements.
- **Responder Workflow Pipeline**: Coordinator requests responder assistance -> Responder receives request in Volunteer Portal -> Accepts/Declines -> Live status tracking (*EN_ROUTE*, *ON_SCENE*, *IN_PROGRESS*, *COMPLETED*).
- **10-Section AI-Generated Response Workspace**: Interactive incident room providing crisis analysis, requirement tracking, Qdrant vector matched volunteers/resources/organizations, action recommendations, and timeline auditing.
- **Coordinator Overview Dashboard**: Real-time operational dashboard with network metrics, active crisis priority sorting, and dynamic `⚡ NEEDS ATTENTION` alerts.

---

## 3. Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python 3.10+

### Backend Setup
From the project root:
```bash
# Install Node backend dependencies
cd Backend
npm install

# Start Node backend server (Port 5000)
node src/server.js

# Start Python authentication service (Port 5002)
python auth_service.py
```

### Frontend Setup
From the project root:
```bash
# Install frontend dependencies
npm install

# Start Vite development server (Port 5173)
npm run dev
```

---

## 4. API & Health Endpoints

- **Frontend Application**: `http://localhost:5173`
- **Node Backend Server**: `http://localhost:5000/api`
  - Health Endpoint: `GET http://localhost:5000/api/health`
  - DB Health: `GET http://localhost:5000/api/db/health`
- **Python Auth Service**: `http://localhost:5002/api/auth`
  - Auth Health: `GET http://localhost:5002/api/auth/health`

---

## 5. Verification Test Suites

To execute the full automated test suite:
```bash
# Phase 6 verification test suite (44/44 passed)
node Backend/test_phase6.js

# Phase 7 verification test suite (39/39 passed)
node Backend/test_phase7.js
```
