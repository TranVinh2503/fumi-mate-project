# 文メイト (Fumi-Mate) - Next.js Frontend

A modern Japanese learning platform built with Next.js 14, TypeScript, and TailwindCSS. This is the frontend-only version of the fumi-mate project, designed to work with a Flask backend API.

## 🚀 Features

- **Modern Stack**: Next.js 14 with App Router, TypeScript, and TailwindCSS
- **Role-Based Access**: Separate interfaces for students and teachers
- **Writing Practice**: Japanese writing tests with AI-powered feedback
- **Task Management**: Teachers can create and manage assignments
- **Submission Review**: Track and review student submissions
- **Responsive Design**: Mobile-friendly interface with custom Japanese fonts
- **Mock Data**: Pre-populated with sample data for development

## 📁 Project Structure

```
fumi-mate-nextjs/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with navbar and footer
│   ├── page.tsx                 # Home page
│   ├── login/                   # Login page
│   ├── register/                # Registration page
│   ├── student/                 # Student pages
│   │   ├── tasks/              # View available tasks
│   │   ├── submissions/        # View submissions
│   │   └── writing-test/       # Take writing tests
│   └── teacher/                 # Teacher pages
│       ├── tasks/              # Manage tasks
│       ├── create-task/        # Create new tasks
│       └── submissions/        # Review submissions
├── components/                   # Reusable React components
│   ├── layout/                  # Layout components
│   │   ├── DynamicBar.tsx      # Top notification bar
│   │   ├── Navbar.tsx          # Navigation bar
│   │   ├── Footer.tsx          # Footer
│   │   └── ProfileDropdown.tsx # User profile menu
│   └── ui/                      # UI components (to be added)
├── lib/                         # Utility functions and types
│   ├── types.ts                # TypeScript interfaces
│   ├── mockData.ts             # Mock data for development
│   └── utils.ts                # Helper functions
├── public/                      # Static assets
│   └── images/                 # Images and icons
└── tailwind.config.ts          # Tailwind configuration

```

## 🎨 Design System

### Colors
- **Primary**: `#F75270` (Pink)
- **Secondary**: `#DC143C` (Crimson)
- **Dark**: `#000000`
- **White**: `#FFFFFF`

### Fonts
- **Japanese Text**: Zen Maru Gothic
- **Titles**: DM Serif Text
- **Decorative**: Parisienne

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Run development server**:
```bash
npm run dev
```

3. **Open browser**:
Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 📝 Mock Data

The application uses mock data defined in `lib/mockData.ts`. This includes:

- **Users**: Sample students and teachers
- **Tasks**: Pre-created writing assignments
- **Submissions**: Example student submissions with AI feedback
- **Questions**: Sample questions for tasks

## 🔌 API Integration (TODO)

All API calls are currently replaced with mock data and TODO comments. To integrate with the Flask backend:

1. Create an API client in `lib/api.ts`
2. Replace mock data calls with actual API endpoints
3. Implement authentication using NextAuth.js or similar
4. Add error handling and loading states

### Example API Endpoints to Implement:

```typescript
// Authentication
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout

// Student Routes
GET /api/student/tasks
GET /api/student/submissions
POST /api/student/submit-test
GET /api/student/submission/:id

// Teacher Routes
GET /api/teacher/tasks
POST /api/teacher/create-task
PUT /api/teacher/edit-task/:id
GET /api/teacher/submissions
POST /api/teacher/grade-submission/:id
```

## 🎯 User Flows

### Student Flow
1. Login → View Tasks
2. Select Task → Take Writing Test
3. Submit Test → View Feedback
4. Check Submissions → Review AI & Teacher Feedback

### Teacher Flow
1. Login → View Tasks
2. Create New Task → Set Questions & Deadline
3. View Submissions → Grade & Provide Feedback
4. Manage Tasks → Edit or Delete

## 🧩 Key Components

### Layout Components
- **DynamicBar**: Scrolling notification bar at the top
- **Navbar**: Main navigation with role-based menu items
- **Footer**: Site footer with links and social media
- **ProfileDropdown**: User profile menu with settings

### Page Components
- **Home**: Landing page with Japanese culture sections
- **Login/Register**: Authentication pages
- **Student Dashboard**: Task list and submission history
- **Teacher Dashboard**: Task management and grading interface
- **Writing Test**: Interactive writing test interface
- **Submission Detail**: Detailed feedback view

## 🎨 Styling

The project uses TailwindCSS with custom configurations:

- Custom color palette matching the original design
- Japanese font integration
- Responsive breakpoints
- Custom animations and transitions
- Utility classes for common patterns

## 📱 Responsive Design

The application is fully responsive with breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🔐 Authentication (TODO)

Currently, authentication is mocked. To implement:

1. Install NextAuth.js or similar
2. Create authentication context
3. Protect routes with middleware
4. Store user session
5. Implement role-based access control

## 🚧 Development Notes

### Current Status
- ✅ Project structure setup
- ✅ Layout components
- ✅ Authentication pages
- ✅ Mock data
- ⏳ Student pages (in progress)
- ⏳ Teacher pages (in progress)
- ❌ API integration
- ❌ Real authentication

### Next Steps
1. Complete all student pages
2. Complete all teacher pages
3. Add form validation
4. Implement API client
5. Add loading states
6. Add error handling
7. Write tests

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Lucide Icons](https://lucide.dev)

## 🤝 Contributing

This is a frontend-only version. When contributing:

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Follow the design system
4. Add TODO comments for API calls
5. Test responsive design

## 📄 License

[Add your license here]

## 👥 Team

[Add team information here]

---

**Note**: This is a frontend-only implementation. All API calls are mocked and need to be connected to the Flask backend for full functionality.
