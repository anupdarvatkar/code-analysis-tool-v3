# Code_conversation_agent - ADK Agents

## Project Structure

- **backend-apis**: FastAPI backend for code analysis APIs
- **frontend**: React + Vite frontend dashboard and chat UI
- **code_conversation_agent/chat_agent**: ADK agent server for code conversation

---

## How to Run

### 1. Backend API (FastAPI)

**Directory:** `backend-apis`  
**Default IP/Port:** `http://127.0.0.1:8085`

**Install dependencies:**
```powershell
cd backend-apis
pip install -r requirements.txt
```

**Run the server:**
```powershell
uvicorn main:app --host 127.0.0.1 --port 8085
```

---

### 2. Frontend (React + Vite)

**Directory:** `frontend`  
**Default IP/Port:** `http://localhost:3000`

**Install dependencies:**
```powershell
cd frontend
npm install
```

**Run the development server:**
```powershell
npm run dev
```

**Access the app:**  
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 3. Chat Agent (ADK API Server)

**Directory:** `code_conversation_agent/chat_agent`  
**Default IP/Port:** `http://127.0.0.1:9000`

**Install dependencies:**
```powershell
cd code_conversation_agent/chat_agent
pip install -r requirements.txt
```

**Run the ADK API server:**
```powershell
adk api_server --host 127.0.0.1 --port 9000
```

---

## API Endpoints

- **Backend API:**  
  - `http://127.0.0.1:8085/classes/dependencies`
  - `http://127.0.0.1:8085/packages/class-counts`
  - `http://127.0.0.1:8085/nodes/count-of-classes`
  - `http://127.0.0.1:8085/classes/functional-specification?class_name=...`

- **Chat Agent:**  
  - `http://127.0.0.1:9000/run_sse`
  - `http://127.0.0.1:9000/apps/TALK_CODE/users/{user_id}/sessions/{session_id}`

---

## Example Code Conversation Queries

- Can you provide Functional Breakdown of UserController?
- Can you share Rules in the UserController?
- Can you share Rules in AdminController?
- Can you show dependencies for AdminController. Go up to 5 levels and show as a diagram.
- Based on these dependencies, can you provide a functional breakdown (follow up question)?
- Can you share the dependencies for UserController? Share only internal dependencies. Also, for the dependencies, share the type.

---

## Notes

- Make sure all servers (backend, frontend, chat agent) are running on their respective ports.
- For development, API requests from the frontend are proxied to the backend and chat agent to avoid CORS issues.
- Update `.env.local` and `.env` files as needed for configuration.
