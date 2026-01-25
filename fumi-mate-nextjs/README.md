# 文メイト (Fumi-Mate) - Next.js Frontend

A modern Japanese learning platform built with Next.js 14, TypeScript, and TailwindCSS.

## Features

- Modern Stack: Next.js 14 with App Router, TypeScript, and TailwindCSS
- Role-Based Access: Separate interfaces for students and teachers
- Writing Practice: Japanese writing tests with AI-powered feedback
- Task Management: Teachers can create and manage assignments
- Submission Review: Track and review student submissions
- Responsive Design: Mobile-friendly interface with custom Japanese fonts
- JWT Authentication: Secure login/logout with role-based access

## Project Structure

fumi-mate-nextjs/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with navbar and footer
│   ├── page.tsx                 # Home page
│   ├── login/                   # Login page
│   ├── register/                # Registration page
│   ├── student/                 # Student pages
│   │   ├── tasks/              # View available tasks
│   │   ├── writing-test/[id]/  # Take writing tests
│   │   └── submissions/        # View submissions
│   └── teacher/                 # Teacher pages
│       ├── tasks/              # Manage tasks
│       └── submissions/        # Review submissions
├── components/                   # Reusable React components
│   └── layout/                  # Layout components
│       ├── Navbar.tsx          # Navigation bar
│       ├── Footer.tsx          # Footer
│       └── ProfileDropdown.tsx # User profile menu
├── context/                      # React contexts
│   └── AuthContext.tsx          # Authentication context
├── lib/                         # Utility functions and types
│   ├── types.ts                # TypeScript interfaces
│   └── utils.ts                # Helper functions
└── public/                      # Static assets

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
cd fumi-mate-nextjs
npm install
```

2. Configure environment variables:
Create .env.local file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

3. Run development server:
```bash
npm run dev
```

4. Open browser:
Navigate to http://localhost:3000

### Build for Production

```bash
npm run build
npm start
```

## Pages

### Public Pages
| Route | Description |
|-------|-------------|
| / | Home page |
| /login | Login page |
| /register | Registration page |

### Student Pages
| Route | Description |
|-------|-------------|
| /student/tasks | View all available tasks |
| /student/writing-test/[id] | Take writing test |
| /student/submissions | View all submissions |

### Teacher Pages
| Route | Description |
|-------|-------------|
| /teacher/tasks | View all tasks |
| /teacher/tasks/create | Create new task |
| /teacher/submissions | View all submissions |

## Authentication

The application uses JWT-based authentication:
1. Login stores the token in localStorage as 'access_token'
2. User info is stored in localStorage as 'user'
3. Token is sent in Authorization header for API calls

## Design System

### Colors
- Primary: #F75270 (Pink)
- Secondary: #DC143C (Crimson)
- Dark: #000000

### Fonts
- Japanese Text: Zen Maru Gothic
- Titles: DM Serif Text

## Dependencies

- next - React framework
- react - UI library
- tailwindcss - Utility-first CSS framework
- typescript - Type safety
- lucide-react - Icons

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

## Resources

- Next.js Documentation: https://nextjs.org/docs
- TailwindCSS Documentation: https://tailwindcss.com/docs
- TypeScript Documentation: https://www.typescriptlang.org/docs

