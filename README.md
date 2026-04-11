# 🤖 AI-Assisted Pull Request Review System

A full-stack collaborative code review platform where contributors submit pull requests on file changes and an **AI (Google Gemini)** automatically reviews every PR — checking code quality, detecting regressions, and flagging rule violations before the repository owner manually accepts or rejects it.

---

## ✨ Features

### 🔐 Authentication & User Management
- Register via **Email** or **Phone Number** with OTP verification (Nodemailer + Twilio)
- Login with JWT-based **Access + Refresh Token** authentication (stored in httpOnly cookies)
- Forgot password via email reset link or SMS OTP
- Update profile, change password, add/verify a new email address
- Full OTP expiry management and clean re-registration flow

### 📁 Repository Management
- Create, view, and delete repositories (public / private)
- Configurable **Rule Engine** per repository with supported rules:
  - `minCommitMessageLength` — enforce minimum commit message length
  - `disallowTodo` — block TODO comments in code
  - `disallowConsoleLog` — prevent `console.log` statements
  - `disallowVar` — enforce `let`/`const` over `var`
  - `requireIssueLink` — require issue references (e.g. `#123`) in commit messages
  - `maxFileLines` — set a maximum allowed lines per file
  - `disallowDebugger` — block `debugger` statements
- Add, update, and remove rules dynamically; rules are validated by type at the API level

### 📄 File Management
- Create and view files within repositories
- Full **version history** tracking — every accepted PR creates a new version snapshot with content, commit message, and author
- File size auto-calculated from the latest accepted version

### 🔀 Pull Requests with AI Review
- Contributors and owners can open PRs against any file
- Before creating a PR, the system:
  1. Validates against all **repository rules**
  2. Prevents same-content submissions and duplicate pending PRs
  3. Sends content to **Google Gemini 2.5 Flash** for a structured AI review
- AI review output includes:
  - `status` — `good` or `bad` (critical issues → bad)
  - `summary` — what changed between previous and new code
  - `issues` — typed as `critical`, `warning`, or `suggestion`
  - `improvements` — optional enhancement suggestions
  - `commitMessageFeedback` — quality feedback on the commit message
- Repository owner can **accept** or **reject** any pending PR
- Accepted PRs update the file content and push a new version to history

### 👥 Contributor Management (Consent-Based)
- **Invite by email** — sends a tokenized email with Accept / Decline links (7-day expiry)
- **Invite in-app** — sends a notification with Accept / Decline buttons (no email required)
- Users accept or decline invitations from their notifications panel
- Idempotent acceptance flow — safe against double-clicks and React Strict Mode re-renders
- Owner can cancel pending invitations; removal triggers a notification to the contributor

### 🔔 Notifications
- Real-time in-app notifications for:
  - New PR created (notifies repo owner)
  - PR accepted / rejected (notifies PR author)
  - Contributor invited / accepted / declined / removed
- Invitation notifications carry a token that powers the in-app Accept / Decline buttons
- Notifications are automatically marked as read when an invitation is acted upon

### 📊 Analytics & Stats
- **Repository stats** — PR counts, acceptance rate, AI review breakdown, top rule violations, most active contributors, most-updated files, comment count, recent activity
- **User stats** — repos owned/contributed, personal PR breakdown, acceptance rate, most-active repositories, recent PRs, unread notifications

### 🔍 Search
- Search **repositories**, **users**, **files**, and **pull requests** individually or all at once via a global search endpoint
- Results are automatically filtered to only show content the requesting user is authorized to see

### 🗂️ Activity Feed
- Every significant action (repo created, PR created/accepted/rejected, rule updated, contributor joined/removed) creates a persistent activity record
- The feed is queryable per-repository or globally for the authenticated user

### 💬 Comments
- Comment on individual pull requests
- Comment count is tracked in repository stats

---

## 🏗️ Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js v5 |
| Database | MongoDB via Mongoose |
| AI Integration | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| Authentication | JWT (jsonwebtoken) + bcrypt |
| Email | Nodemailer |
| SMS (OTP) | Twilio |
| Dev Server | Nodemon |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Routing | React Router v7 |
| State Management | Zustand |
| Server State | TanStack Query (React Query v5) |
| HTTP Client | Axios |
| UI | Lucide React icons, react-hot-toast |
| Styling | Tailwind CSS v4 + Vanilla CSS (glassmorphism design system) |
| Date Formatting | date-fns |

---

## 📂 Project Structure

```
AI ASSISTED PR REVIEW SYSTEM/
├── backend/
│   └── src/
│       ├── app.js                  # Express app setup, CORS, routes mounting
│       ├── server.js               # HTTP server entry point
│       ├── config/                 # DB connection config
│       ├── controllers/
│       │   ├── user.controller.js          # Auth, profile, password management
│       │   ├── repository.controller.js    # Repo CRUD + rule engine
│       │   ├── file.controller.js          # File CRUD + versioning
│       │   ├── pullRequest.controller.js   # PR creation, AI review, acceptance
│       │   ├── contributor.controller.js   # Invitation flow, contributor management
│       │   ├── notification.controller.js  # Notification CRUD
│       │   ├── comment.controller.js       # PR comments
│       │   ├── activity.controller.js      # Activity feed
│       │   ├── stats.controller.js         # Repo & user analytics
│       │   └── search.controller.js        # Global, scoped search
│       ├── models/
│       │   ├── user.model.js
│       │   ├── repository.model.js
│       │   ├── file.model.js               # With version sub-schema
│       │   ├── pullRequest.model.js        # With ruleResult + aiResult sub-schemas
│       │   ├── invitation.model.js         # Email & in-app invitation support
│       │   ├── notification.model.js
│       │   ├── comment.model.js
│       │   └── activity.model.js
│       ├── routes/                  # One route file per resource
│       ├── middlewares/
│       │   ├── auth.middleware.js    # JWT verification
│       │   └── error.middleware.js   # Centralized error handler
│       ├── services/
│       └── utils/
│           ├── ApiError.js
│           ├── ApiResponse.js
│           ├── asyncHandler.js
│           ├── allowedRules.js       # Rule definitions + type constraints
│           ├── createNotification.js
│           ├── createActivity.js
│           ├── email.js              # OTP, reset link, invitation emails
│           ├── sms.js                # Twilio OTP dispatch
│           └── generateOtp.js
└── frontend/
    └── src/
        ├── App.jsx                  # Routes (public + protected)
        ├── pages/
        │   ├── auth/                # Login, Register, VerifyOtp, ForgotPassword, ResetPassword
        │   ├── dashboard/
        │   ├── repository/          # List, Detail, Settings (rules)
        │   ├── file/                # File detail + version history viewer
        │   ├── pullRequest/         # PR list, PR detail (AI review), Create PR
        │   ├── contributor/         # Manage contributors + pending invitations
        │   ├── invitation/          # Accept / Decline invitation pages
        │   ├── notification/
        │   ├── stats/
        │   ├── search/
        │   ├── activity/
        │   └── profile/
        ├── components/              # Shared UI components
        ├── store/                   # Zustand stores (auth, etc.)
        ├── api/                     # Axios API client modules
        ├── hooks/                   # Custom React hooks
        └── utils/                   # Frontend utility helpers
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB instance (local or Atlas)
- Google Gemini API key
- SMTP credentials (Nodemailer)
- Twilio Account SID + Auth Token + Phone Number

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ai-assisted-pr-review-system.git
cd ai-assisted-pr-review-system
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/ai-pr-review
CORS_ORIGIN=http://localhost:5173

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d

GEMINI_API_KEY=your_gemini_api_key

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Twilio (SMS OTP)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE=+1234567890

FRONTEND_URL=http://localhost:5173
```

Start the backend dev server:

```bash
npm run dev
```

The API will be available at `http://localhost:8000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8000
```

Start the frontend dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🔌 API Endpoints

### Auth & Users — `/api/v1/users`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Register (email or phone) |
| POST | `/verify-otp` | Verify registration OTP |
| POST | `/login` | Login |
| POST | `/logout` | Logout |
| POST | `/refresh-token` | Refresh access token |
| GET | `/me` | Get current user |
| PATCH | `/change-password` | Change password |
| PATCH | `/update-profile` | Update full name / phone |
| POST | `/add-email` | Initiate email add/update (sends OTP) |
| POST | `/verify-email-profile` | Confirm email OTP to complete update |
| POST | `/forgot-password` | Send password reset link or OTP |
| POST | `/reset-password/:token` | Reset password via token |

### Repositories — `/api/v1/repos`
| Method | Path | Description |
|---|---|---|
| POST | `/` | Create repository |
| GET | `/` | List user's repositories |
| GET | `/:repoId` | Get repository by ID |
| PATCH | `/:repoId` | Update repo (name, description, visibility, rules) |
| DELETE | `/:repoId` | Delete repository |
| GET | `/:repoId/rules` | Get active rules + allowed rules catalog |

### Files — `/api/v1/files`
| Method | Path | Description |
|---|---|---|
| POST | `/:repoId` | Create file in a repository |
| GET | `/:repoId` | List files in a repository |
| GET | `/:fileId` | Get file detail (with version history) |

### Pull Requests — `/api/v1/pr`
| Method | Path | Description |
|---|---|---|
| POST | `/files/:fileId` | Create PR (triggers AI review) |
| GET | `/:repoId` | List PRs for a repository |
| GET | `/:prId` | Get PR detail (with AI review result) |
| PATCH | `/:prId/review` | Accept or reject a PR (owner only) |

### Contributors — `/api/v1/repos`
| Method | Path | Description |
|---|---|---|
| GET | `/:repoId/contributors` | List contributors |
| POST | `/:repoId/contributors/invite` | Invite by email (sends email invitation) |
| POST | `/:repoId/contributors/add` | Invite in-app (sends notification) |
| DELETE | `/:repoId/contributors/:userId` | Remove a contributor |
| GET | `/:repoId/invitations` | List pending invitations (owner only) |
| DELETE | `/invitations/:invitationId` | Cancel a pending invitation |
| POST | `/invitations/accept/:token` | Accept an invitation |
| POST | `/invitations/decline/:token` | Decline an invitation |

### Notifications — `/api/v1/notifications`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Get all notifications |
| PATCH | `/:id/read` | Mark a notification as read |
| PATCH | `/read-all` | Mark all notifications as read |
| DELETE | `/:id` | Delete a notification |

### Comments — `/api/v1/pr`
| Method | Path | Description |
|---|---|---|
| POST | `/:prId/comments` | Add a comment to a PR |
| GET | `/:prId/comments` | Get comments for a PR |

### Stats — `/api/v1/stats`
| Method | Path | Description |
|---|---|---|
| GET | `/repo/:repoId` | Repository statistics |
| GET | `/user` | Current user statistics |

### Search — `/api/v1/search`
| Method | Path | Description |
|---|---|---|
| GET | `/repos?q=` | Search repositories |
| GET | `/users?q=` | Search users |
| GET | `/files?q=` | Search files |
| GET | `/prs?q=&status=` | Search pull requests |
| GET | `/global?q=` | Search all resources at once |

### Activity — `/api/v1/activity`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Get global activity feed |
| GET | `/:repoId` | Get activity feed for a repository |

---

## 🧠 How the AI Review Works

When a PR is submitted, the backend:

1. **Runs the rule engine** against the file content and commit message
2. **Constructs a prompt** for Gemini 2.5 Flash that includes:
   - The previous file content (for diff-aware contextual review)
   - The new content
   - The commit message
   - Any rule violations detected
3. **Parses the structured JSON response** from the AI
4. **Determines final status** — `bad` only if there are `critical` issues, otherwise `good`
5. **Stores the full AI result** with the PR — summary, issues (with `why` + `fix`), improvements, and commit message feedback

If the AI is unavailable, the system gracefully falls back to rule-only evaluation.

---

## 🔒 Security Highlights

- Passwords hashed with **bcrypt** (10 salt rounds)
- Tokens stored in **httpOnly, SameSite=Strict cookies**
- Invitation tokens are **SHA-256 hashed** before storage (raw token travels via email/notification only)
- All mutation endpoints protected by **JWT auth middleware**
- Role checks (owner vs. contributor vs. public) enforced on every sensitive route
- OTP expiry with **automatic cleanup** of unverified registrations

---

## 📄 License

This project is for educational and portfolio purposes.

---

<div align="center">

Built with ❤️ using **Node.js**, **React**, and **Google Gemini AI**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=flat-square&logo=google&logoColor=white)

</div>
