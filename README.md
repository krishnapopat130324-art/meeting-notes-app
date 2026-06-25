# 📝 Meeting Notes App

> **An AI-powered meeting transcription and summarization platform with real-time collaboration capabilities.**

Meeting Notes App automatically converts speech into text, generates intelligent summaries with action items using AI, and enables multiple users to collaborate in real time through WebSockets.

Built with React, Node.js, SQLite, and Google Gemini AI, the platform helps teams capture, organize, and manage meeting discussions more efficiently.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.1-06B6D4)
![Tests](https://img.shields.io/badge/tests-18%20passing-brightgreen)

---

## ✨ Features

### Core Features

| Feature                    | Description                                       |
| -------------------------- | ------------------------------------------------- |
| 🎤 Speech-to-Text          | Real-time transcription using Web Speech API      |
| 🤖 AI Summarization        | Intelligent summaries powered by Google Gemini AI |
| 💾 Auto Save               | Automatically saves notes every 5 seconds         |
| 👥 Real-Time Collaboration | Multiple users can edit simultaneously            |
| 📋 Export Options          | Copy to clipboard or download as TXT file         |
| 🔍 Search                  | Search meetings by title or content               |
| 🗑️ Meeting Management     | Create, update, and delete meetings               |
| 📊 Statistics              | Character, word, and line counts                  |
| ✅ Testing                  | 18 unit and integration tests passing             |

---

### Technical Highlights

* ⚡ Performance optimized with debouncing and memoization
* 🛡️ Comprehensive error handling
* 📱 Responsive design for all screen sizes
* 🔌 WebSocket support for live collaboration
* 🗄️ SQLite database for lightweight storage
* 🚀 Fast local deployment without additional services

---

## 🛠️ Technology Stack

### Backend

| Technology       | Version | Purpose                 |
| ---------------- | ------- | ----------------------- |
| Node.js          | 18.x    | Runtime Environment     |
| Express          | 4.18.2  | Backend Framework       |
| SQLite           | 5.1.6   | Database                |
| Socket.io        | 4.7.2   | Real-Time Communication |
| Google Gemini AI | Latest  | AI Summarization        |
| Jest             | 29.7.0  | Testing Framework       |

### Frontend

| Technology       | Version | Purpose                 |
| ---------------- | ------- | ----------------------- |
| React            | 18.2.0  | User Interface          |
| Vite             | 5.1.5   | Build Tool              |
| TailwindCSS      | 3.4.1   | Styling Framework       |
| React Router     | 6.22.2  | Routing                 |
| Socket.io Client | 4.7.4   | Real-Time Communication |
| Web Speech API   | Native  | Speech Recognition      |

---

## 🚀 Getting Started

### Prerequisites

* Node.js v16 or higher
* npm v8 or higher
* Google Chrome (recommended for speech recognition)

### Clone Repository

```bash
git clone https://github.com/krishnapopat130324-art/meeting-notes-app.git
cd meeting-notes-app
```

### Install Backend Dependencies

```bash
cd backend
npm install
```

### Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env` file inside the backend folder:

```env
PORT=5000
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### Run Backend

```bash
cd backend
npm run dev
```

Backend runs at:

```text
http://localhost:5000
```

### Run Frontend

```bash
cd frontend
npm run dev
```

Frontend runs at:

```text
http://localhost:3000
```

---

## 🎯 How It Works

### 1. Create a Meeting

* Enter meeting title
* Create a new meeting session
* Open the meeting room

### 2. Record Speech

* Start recording
* Allow microphone access
* Speak naturally
* Watch transcription appear in real time
* Stop recording when finished

### 3. Generate AI Summary

The AI automatically generates:

* 📝 Meeting Summary
* ✅ Action Items
* 🎯 Decisions Made
* 📌 Key Discussion Points

### 4. Save and Export

* Auto-save every 5 seconds
* Manual save option
* Copy all content to clipboard
* Download notes as TXT file

---

## 🧪 Testing

The backend contains **18 passing tests** covering:

* API routes
* Validation
* Error handling
* Edge cases
* CRUD operations

Run tests:

```bash
cd backend
npm test
```

Generate coverage report:

```bash
npm test -- --coverage
```

Example output:

```text
Test Suites: 2 passed, 2 total
Tests:       18 passed, 18 total
```

---

## 📁 Project Structure

```text
meeting-notes-app/
│
├── backend/
│   ├── server.js
│   ├── routes.js
│   ├── database-sqlite.js
│   ├── api.js
│   ├── tests/
│   │   ├── api.test.js
│   │   └── meetings.test.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── hooks/
│   │   ├── App.jsx
│   │   ├── Dashboard.jsx
│   │   ├── MeetingRoom.jsx
│   │   ├── api.js
│   │   ├── useSpeech.js
│   │   └── main.jsx
│   │
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## 🔧 API Endpoints

| Method | Endpoint            | Description         |
| ------ | ------------------- | ------------------- |
| GET    | `/api/meetings`     | Get all meetings    |
| POST   | `/api/meetings`     | Create meeting      |
| GET    | `/api/meetings/:id` | Get meeting         |
| PUT    | `/api/meetings/:id` | Update meeting      |
| DELETE | `/api/meetings/:id` | Delete meeting      |
| POST   | `/api/summarize`    | Generate AI summary |

---

## 📌 Example API Response

```json
[
  {
    "_id": "1740000000000",
    "title": "Team Sync Meeting",
    "transcript": "We discussed the project timeline...",
    "summary": "The team discussed project milestones and deadlines.",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

## 👨‍💻 Author

**Krishna Popat**

Building AI-powered applications that improve productivity, collaboration, and workflow automation.

---

⭐ If you found this project interesting, consider giving it a star on GitHub.
