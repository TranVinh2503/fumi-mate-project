# Authentication System Documentation

This document explains the login and registration flow for the Fumi-mate application.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │  /login/page    │    │ /register/page  │    │ AuthContext     │  │
│  │  (Login Form)   │    │ (Register Form) │    │ (State Mgmt)    │  │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘  │
│           │                      │                      │            │
│           │  fetch POST          │  fetch POST          │            │
│           │  /api/auth/login     │  /api/auth/register │            │
│           ▼                      ▼                      ▼            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              localStorage (access_token, user)              │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              │ HTTP POST (JSON)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Flask)                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    /api/auth/login                          │   │
│  │  - Validate username/password                               │   │
│  │  - Check password hash against database                     │   │
│  │  - Generate JWT access_token                                │   │
│  │  - Return user info and token                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   /api/auth/register                        │   │
│  │  - Validate input fields                                    │   │
│  │  - Check username uniqueness                                │   │
│  │  - Hash password                                            │   │
│  │  - Create User record + Profile (Student/Teacher)          │   │
│  │  - Return success message                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      PostgreSQL Database                    │   │
│  │  ┌───────────┐  ┌─────────────────┐  ┌─────────────────┐   │   │
│  │  │   users   │  │ student_profiles│  │ teacher_profiles│   │   │
│  │  └───────────┘  └─────────────────┘  └─────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Backend (Flask) - API Endpoints

### File: `fumi-mate-api/app/routes/auth.py`

#### 1. POST `/api/auth/register`

**Purpose:** Create a new user account

**Request:**
```json
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123",
  "role": "student"
}
```

**Validation Rules:**
- `username`: 3-20 characters, letters/numbers/underscore only
- `password`: minimum 6 characters
- `role`: must be "student", "teacher", or "admin"

**Response (Success - 201):**
```json
{
  "message": "Registered successfully",
  "user_id": 1
}
```

**Response (Error):**
```json
{
  "message": "Invalid username or role or password"
}
```

**Database Operations:**
1. Check if username already exists
2. Hash password using `werkzeug.security.generate_password_hash()`
3. Create `User` record with username, password_hash, and role
4. Create corresponding profile (`StudentProfile` or `TeacherProfile`)
5. Commit transaction to database

---

#### 2. POST `/api/auth/login`

**Purpose:** Authenticate user and get JWT token

**Request:**
```json
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "testuser",
    "role": "student"
  }
}
```

**Response (Error - 401):**
```json
{
  "message": "Invalid username or password"
}
```

**Authentication Flow:**
1. Find user by username in database
2. Verify password using `werkzeug.security.check_password_hash()`
3. Generate JWT token with user identity (id and role)
4. Return token and user info

---

#### 3. GET `/api/auth/me` (Protected)

**Purpose:** Get current authenticated user info

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": 1,
  "username": "testuser",
  "role": "student"
}
```

---

## Frontend (Next.js) - Components

### File: `fumi-mate-nextjs/app/login/page.tsx`

**Component:** `LoginPage`

**State:**
```typescript
interface FormData {
  username: string;
  password: string;
}
```

**Login Flow:**
1. User enters username and password
2. `handleSubmit` is triggered on form submission
3. Client-side validation (non-empty fields)
4. Fetch POST to `http://localhost:5001/api/auth/login`
5. On success:
   - Save `access_token` to `localStorage`
   - Call `login()` from AuthContext
   - Show success message
   - Redirect to `/{role}/tasks` (e.g., `/student/tasks`)
6. On error: Display error message

**Code Flow:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const res = await fetch("http://localhost:5001/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    setMessage(data.message || "Login failed");
    return;
  }
  
  // Save token
  localStorage.setItem("access_token", data.access_token);
  
  // Update auth context
  login({ username: data.user.username, userRole: data.user.role });
  
  // Redirect
  router.push(`/${data.user.role}/tasks`);
};
```

---

### File: `fumi-mate-nextjs/app/register/page.tsx`

**Component:** `RegisterPage`

**State:**
```typescript
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [role, setRole] = useState<"student" | "teacher" | "admin">("student");
const [message, setMessage] = useState('');
const [loading, setLoading] = useState(false);
```

**Register Flow:**
1. User enters username, password, and selects role
2. `handleSubmit` is triggered on form submission
3. Fetch POST to `http://localhost:5001/api/auth/register`
4. On success:
   - Save `access_token` to `localStorage`
   - Show success message
   - Redirect to home page after 1.5 seconds
5. On error: Display error message

**Note:** The register endpoint currently doesn't return an `access_token` on the backend. This is a bug - the frontend expects one but the backend only returns `user_id`.

---

### File: `fumi-mate-nextjs/context/AuthContext.tsx`

**Purpose:** Global authentication state management

**AuthContext Interface:**
```typescript
interface AuthContextType {
  user: User;
  login: (userData: Omit<User, 'isAuthenticated'>) => void;
  logout: () => void;
}

interface User {
  isAuthenticated: boolean;
  userRole?: 'student' | 'teacher' | 'admin';
  username?: string;
}
```

**Key Functions:**
- `login(userData)`: Set authenticated state, save to localStorage
- `logout()`: Clear authenticated state, remove from localStorage
- `useAuth()`: Hook to access auth context anywhere in app

**Initialization:**
- On app load, check `localStorage.getItem('user')` and restore session

---

## Security Features

### Password Security
- **Hashing:** Uses `werkzeug.security.generate_password_hash()` (PBKDF2/SHA256)
- **Verification:** Uses `werkzeug.security.check_password_hash()`
- **Minimum Length:** 6 characters

### JWT Authentication
- **Library:** `flask-jwt-extended`
- **Token Type:** Bearer token
- **Identity:** Contains user `id` and `role`
- **Protected Routes:** Use `@jwt_required()` decorator

### Input Validation
- Username: Alphanumeric + underscore, 3-20 chars
- Password: Minimum 6 characters
- Role: Whitelist only ("student", "teacher", "admin")
- SQL Injection: Protected by SQLAlchemy ORM

---

## Data Flow Diagram

### Login Flow
```
User fills form
    │
    ▼
Validate input (non-empty)
    │
    ▼
POST /api/auth/login {username, password}
    │
    ▼
┌─────────────────────────────┐
│ Backend:                   │
│ 1. Find user by username   │
│ 2. Verify password hash    │
│ 3. Generate JWT token      │
│ 4. Return {token, user}    │
└─────────────────────────────┘
    │
    ▼
Save token: localStorage.setItem('access_token', token)
    │
    ▼
Update AuthContext: login({username, role})
    │
    ▼
Redirect to /{role}/tasks
```

### Register Flow
```
User fills form (username, password, role)
    │
    ▼
POST /api/auth/register {username, password, role}
    │
    ▼
┌─────────────────────────────┐
│ Backend:                   │
│ 1. Validate input          │
│ 2. Check username exists   │
│ 3. Hash password           │
│ 4. Create User record      │
│ 5. Create Profile record   │
│ 6. Return {message, id}    │
└─────────────────────────────┘
    │
    ▼
[BUG] Try to save token (but none returned)
    │
    ▼
Show success message
    │
    ▼
Redirect to home page
```

---

## Known Issues

### 1. Register doesn't return JWT token
**Problem:** The `/api/auth/register` endpoint doesn't return an `access_token`, but the frontend tries to save one.

**Current behavior:**
```json
// Backend returns:
{ "message": "Registered successfully", "user_id": 5 }

// Frontend expects:
{ "access_token": "...", "user": {...} }
```

**Fix needed:** Update backend to also generate and return JWT token on registration.

---

### 2. Missing confirm password field
**Problem:** Register form only has one password field, no confirm password validation.

**Fix:** Add confirm password field and validate both match.

---

### 3. No logout functionality
**Problem:** No logout button in the UI.

**Fix:** Add logout button that calls `logout()` from AuthContext and clears localStorage.

---

## Environment Configuration

| Variable | Value | Description |
|----------|-------|-------------|
| API_URL | `http://localhost:5001` | Backend API base URL |
| JWT_SECRET_KEY | (in Flask config) | Secret for signing JWT tokens |
| DATABASE_URL | PostgreSQL connection | Database connection string |

---

## Testing the API

### Register a new user:
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","password":"password123","role":"student"}'
```

### Login:
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","password":"password123"}'
```

### Access protected route:
```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer <your_access_token>"
```

---

## File Structure

```
fumi-mate-project/
├── fumi-mate-api/
│   ├── app/
│   │   ├── routes/
│   │   │   └── auth.py          # Login/Register API endpoints
│   │   ├── models/
│   │   │   └── user.py          # User model
│   │   └── extensions.py        # JWT, SQLAlchemy setup
│   └── run.py                   # Flask app entry point
│
└── fumi-mate-nextjs/
    ├── app/
    │   ├── login/
    │   │   └── page.tsx         # Login page component
    │   ├── register/
    │   │   └── page.tsx         # Register page component
    │   └── layout.tsx           # Root layout with AuthProvider
    ├── context/
    │   └── AuthContext.tsx      # Authentication state management
    └── lib/
        └── types.ts             # TypeScript type definitions
```

