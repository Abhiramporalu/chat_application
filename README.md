# Adverayze Real-Time Chat Application

This is a full-stack real-time chat application built for the Adverayze technical assignment. It features instant messaging, deletion (for me/everyone), and pinning messages, utilizing a Node.js/Express backend with MongoDB and a modern React (Vite) frontend.

## Features

- **Real-Time Messaging:** Instant message delivery using WebSockets (Socket.IO).
- **Persistent Storage:** Messages are saved in a MongoDB database and loaded on refresh.
- **Delete for Me:** Removes the message from your local view only (synced locally via localStorage-based ID).
- **Delete for Everyone:** Globally deletes the message for all users in real-time.
- **Pin Messages:** Highlights important messages globally at the top of the chat.
- **Premium UI:** Smooth, glassmorphic design system using pure CSS.

## 🛠 Tech Stack

- **Frontend:** React (Vite), pure CSS, date-fns, lucide-react, Socket.IO client.
- **Backend:** Node.js, Express, Socket.IO, Mongoose.
- **Database:** MongoDB.

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB running locally (default: `mongodb://127.0.0.1:27017/adverayze_chat`) or a remote Mongo UI.

### 1. Backend Setup
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Create a `.env` file in the `backend` folder to customize your MongoDB URI.
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/adverayze_chat
   ```
4. Start the backend server:
   ```bash
   npm run dev
   # or
   node server.js
   ```

### 2. Frontend Setup
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser at `http://localhost:5173`. Open multiple tabs or a separate incognito window to see the real-time syncing in action!

##  Approach and Design Decisions

- **Architectural Division:** The project is cleanly separated into a REST/Socket Node.js backend and a React SPA frontend.
- **State Management:** Local React state coupled directly with WebSocket events ensures UI consistency. No complex Redux/Zustand is needed for a single global chat.
- **User Identification:** To simulate "Delete for Me" without complex authentication, the frontend generates a random user ID on its first launch and persists it to `localStorage`. This cleanly proves different clients get different views.
- **Real-Time vs REST:** The initial load of messages uses standard REST (`/api/messages`). All subsequent modifications (sending, deleting, pinning) occur over the WebSocket for zero-latency updates.

## ⚖️ Tradeoffs and Assumptions

- **Global Chat Space:** Assumed a single global chat room. If we wanted private rooms, the data schema and socket room functionality would need extending.
- **Local UserId vs Auth:** For simplicity in a 4-hour test, mocked the user authentication process in favor of focusing on core frontend realtime manipulation. 
- **Tombstoning Deletions:** "Delete for Everyone" replaces the message content with a placeholder rather than explicitly ripping it from the database completely. This handles out-of-order clients better.

## 📖 API Documentation

### REST API
- `GET /api/messages` - Returns all messages chronologically (limit 300).

### WebSocket Events
**Client Emits -> Server:**
- `sendMessage` (content, senderId)
- `deleteMessageForMe` (messageId, userId)
- `deleteMessageForEveryone` (messageId)
- `togglePinMessage` (messageId)

**Server Emits -> Client:**
- `receiveMessage` (message object)
- `messageDeletedForMe` (messageId)
- `messageDeletedForEveryone` (messageId)
- `messagePinnedToggled` (message object)
