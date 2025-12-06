# Quick Start Guide - 文メイト Next.js

## ✅ Installation Complete!

Your Next.js project is now set up and ready to use.

## 🚀 Running the Project

The development server is currently running at:
**http://localhost:3000**

### Commands

```bash
# Start development server (already running)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 📱 Testing the Application

### 1. Home Page
Open your browser and navigate to:
```
http://localhost:3000
```

You should see:
- Hero section with Japanese text
- Tabbed content (Flavors, Culture, Otaku Zone, News, Spirit)
- FAQ section
- Contact section

### 2. Login Page
Navigate to:
```
http://localhost:3000/login
```

Test credentials (mock data):
- Username: `student1` or `teacher1`
- Password: any password (mock authentication)

### 3. Register Page
Navigate to:
```
http://localhost:3000/register
```

Create a new account (mock - data won't persist):
- Enter username
- Enter password
- Confirm password
- Select role (Student or Teacher)

## 🎯 Current Features

### ✅ Working
- Home page with all sections
- Login form with validation
- Register form with validation
- Responsive navigation
- Mobile menu
- Profile dropdown (when authenticated)
- Footer with links
- Scrolling notification bar

### ⏳ Coming Soon
- Student task pages
- Student submission pages
- Writing test interface
- Teacher task management
- Teacher grading interface
- Real API integration

## 🔧 Development Tips

### Hot Reload
The development server supports hot reload. Any changes you make to the code will automatically refresh in the browser.

### TypeScript
All files use TypeScript. VS Code will show type errors in real-time.

### Tailwind CSS
Use Tailwind utility classes for styling. The custom theme is configured in `tailwind.config.ts`.

### Mock Data
All data is currently mocked in `lib/mockData.ts`. You can modify this file to test different scenarios.

## 📂 Key Files to Explore

```
fumi-mate-nextjs/
├── app/
│   ├── page.tsx          # Home page
│   ├── login/page.tsx    # Login page
│   └── register/page.tsx # Register page
├── components/layout/
│   ├── Navbar.tsx        # Navigation bar
│   └── Footer.tsx        # Footer
├── lib/
│   ├── types.ts          # TypeScript types
│   ├── mockData.ts       # Sample data
│   └── utils.ts          # Helper functions
└── tailwind.config.ts    # Styling configuration
```

## 🎨 Customization

### Colors
Edit `tailwind.config.ts` to change the color scheme:
```typescript
colors: {
  primary: '#F75270',    // Change this
  secondary: '#DC143C',  // Change this
}
```

### Fonts
Fonts are configured in `app/layout.tsx`:
- Zen Maru Gothic (Japanese text)
- DM Serif Text (Headings)
- Parisienne (Decorative)

### Layout
The main layout is in `app/layout.tsx`. It includes:
- DynamicBar (top notification)
- Navbar
- Page content
- Footer

## 🐛 Troubleshooting

If you encounter any issues, check `TROUBLESHOOTING.md` for solutions.

### Common Issues

**Port already in use:**
```bash
# Use a different port
npm run dev -- -p 3001
```

**TypeScript errors:**
```bash
# Restart TypeScript server in VS Code
# Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

**Styling not working:**
```bash
# Clear Next.js cache
Remove-Item -Recurse -Force .next
npm run dev
```

## 📝 Next Steps

1. **Explore the application** - Navigate through all pages
2. **Check the code** - Review components and understand the structure
3. **Read documentation** - Check README.md and PROJECT_SUMMARY.md
4. **Plan development** - Review TODO.md for remaining work
5. **Start coding** - Begin implementing student/teacher pages

## 🎓 Learning Resources

- **Next.js Docs**: https://nextjs.org/docs
- **TypeScript**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React**: https://react.dev

## 💡 Pro Tips

1. **Use the browser console** - Check for errors and warnings
2. **Install React DevTools** - Great for debugging components
3. **Use VS Code extensions**:
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - TypeScript and JavaScript Language Features

4. **Keep the terminal open** - Watch for build errors and warnings

## 🎉 You're All Set!

The project is running and ready for development. Open http://localhost:3000 in your browser to see your application!

---

**Need Help?** Check the documentation files or create an issue in the repository.
