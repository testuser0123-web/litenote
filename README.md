# LiteNote

A simple note-taking app with PostgreSQL backend and React frontend.

## Features

- Add and delete notes
- Edit notes with toggle edit mode
- Copy note content to clipboard using Font Awesome icons
- Notes displayed in vertical column layout
- Clean, responsive design

## Setup

### Prerequisites

- Node.js
- PostgreSQL

### Installation

1. Install dependencies:
```bash
npm install
cd client && npm install
```

2. Set up PostgreSQL database:
```bash
psql -U your_username -d postgres -f database.sql
```

3. Update `.env` file with your database credentials:
```
DATABASE_URL=postgresql://username:password@localhost:5432/litenote
PORT=5000
```

4. Start the application:
```bash
npm run dev
```

This will start both the backend server (port 5000) and React frontend (port 3000).

## API Endpoints

- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create a new note
- `PUT /api/notes/:id` - Update a note
- `DELETE /api/notes/:id` - Delete a note