# Testing Steps - 文メイト Next.js Frontend

## ✅ Server Status
Your development server is running at: **http://localhost:3000**

The terminal shows:
- ✓ Compiled successfully
- GET / 200 (Home page working!)
- GET /login compiled (Login page ready!)

## 📝 Step-by-Step Testing Guide

### Step 1: Test Home Page

1. **Open your browser** (Chrome, Firefox, or Edge)
2. **Navigate to**: `http://localhost:3000`
3. **What to check:**
   - ✅ Page loads without errors
   - ✅ You see a hero section with text "You came to the right place"
   - ✅ Japanese text is visible below the title
   - ✅ Navigation bar at the top with "日本語" logo
   - ✅ Tabs for "Flavors", "Culture", "Otaku Zone", "News", "Spirit"
   - ✅ FAQ section below
   - ✅ Contact section at the bottom
   - ✅ Footer with links

4. **Test interactions:**
   - Click on different tabs (Flavors, Culture, etc.) - content should change
   - Scroll down to see all sections
   - Click on FAQ items to expand/collapse

### Step 2: Test Login Page

1. **Navigate to**: `http://localhost:3000/login`
2. **What to check:**
   - ✅ Login form appears
   - ✅ Username input field
   - ✅ Password input field
   - ✅ "Login" button
   - ✅ "Don't have an account? Register" link

3. **Test the form:**
   - Enter username: `student1`
   - Enter password: `password123`
   - Click "Login" button
   - You should see "Login successful! Redirecting..." message
   - After 1 second, it will try to redirect (may show 404 since student pages aren't created yet)

### Step 3: Test Register Page

1. **Navigate to**: `http://localhost:3000/register`
2. **What to check:**
   - ✅ Registration form appears
   - ✅ Username input
   - ✅ Password input
   - ✅ Confirm password input
   - ✅ Role dropdown (Student/Teacher)
   - ✅ "Register" button
   - ✅ "Already have an account? Login" link

3. **Test the form:**
   - Enter username: `testuser`
   - Enter password: `password123`
   - Confirm password: `password123`
   - Select role: Student
   - Click "Register"
   - You should see "Registration successful!" message
   - After 1.5 seconds, redirects to login page

4. **Test validation:**
   - Try entering different passwords in password and confirm fields
   - You should see "Passwords do not match" error

### Step 4: Test Navigation

1. **From home page**, click "Login" in the navbar
   - Should navigate to `/login`

2. **From login page**, click "Register" link
   - Should navigate to `/register`

3. **From register page**, click "Login" link
   - Should navigate back to `/login`

4. **Click the logo** (日本語) in navbar
   - Should navigate back to home page

### Step 5: Test Responsive Design

1. **Resize your browser window** to mobile size (< 768px width)
2. **What to check:**
   - ✅ Mobile menu icon (hamburger) appears
   - ✅ Click it to open mobile menu
   - ✅ Navigation links appear in dropdown
   - ✅ Content adjusts to mobile layout

### Step 6: Check Browser Console

1. **Open browser DevTools** (F12 or Right-click → Inspect)
2. **Go to Console tab**
3. **What to check:**
   - ⚠️ You may see 404 errors for images (expected - images not copied yet)
   - ⚠️ You may see warnings about deprecated modules (safe to ignore)
   - ✅ No critical JavaScript errors
   - ✅ No React errors

### Step 7: Check Terminal Output

1. **Look at your terminal** where `npm run dev` is running
2. **What you should see:**
   ```
   ✓ Compiled / in XXXms
   GET / 200 in XXms
   GET /login 200 in XXms
   GET /register 200 in XXms
   ```

3. **Expected 404s (normal):**
   ```
   GET /images/japan.png 404
   GET /images/sake.png 404
   GET /student/tasks 404 (not created yet)
   GET /teacher/tasks 404 (not created yet)
   ```

## ✅ Success Criteria

Your application is working correctly if:

- [x] Home page loads and displays content
- [x] Login page loads with form
- [x] Register page loads with form
- [x] Navigation between pages works
- [x] Forms accept input
- [x] Form validation works (password mismatch)
- [x] No critical errors in console
- [x] Server responds with 200 status codes

## ⚠️ Expected Issues (Not Errors!)

### 1. Missing Images (404)
**Why:** Images haven't been copied from the Flask project yet
**Impact:** Background images and icons won't show
**Fix:** Copy images from `fumi-mate/app/static/images/` to `fumi-mate-nextjs/public/images/`

### 2. Student/Teacher Pages 404
**Why:** These pages haven't been created yet
**Impact:** Clicking on student/teacher links shows 404
**Fix:** Will be created in next phase (see TODO.md)

### 3. Deprecation Warnings
**Why:** Some npm packages use deprecated modules
**Impact:** None - just warnings
**Fix:** Can be ignored or updated later

## 🐛 If You See Errors

### CSS Compilation Error
If you see errors about Tailwind classes:
1. Stop the server (Ctrl+C)
2. Delete `.next` folder
3. Run `npm run dev` again

### Port Already in Use
If port 3000 is busy:
```bash
npm run dev -- -p 3001
```
Then open `http://localhost:3001`

### Module Not Found
If you see "Module not found" errors:
```bash
npm install
npm run dev
```

## 📸 What You Should See

### Home Page
- Hero section with dark overlay and Japanese text
- Scrolling notification bar at the very top
- Navigation bar with logo and menu items
- Tabbed content section
- FAQ accordion
- Contact section with map
- Footer with links

### Login Page
- Clean white form card
- Centered on page
- Username and password fields
- Login button
- Link to register page

### Register Page
- Similar to login page
- Additional fields: confirm password, role selector
- Register button
- Link to login page

## 🎉 Next Actions

Once you confirm everything is working:

1. **Copy images** from Flask project (optional)
2. **Create student pages** (see TODO.md)
3. **Create teacher pages** (see TODO.md)
4. **Add more components** as needed

## 💡 Pro Tips

1. **Keep terminal open** - Watch for compilation errors
2. **Use browser DevTools** - Check console for errors
3. **Test on different browsers** - Chrome, Firefox, Edge
4. **Test responsive design** - Resize browser window
5. **Check network tab** - See what's loading

---

**Ready to proceed?** If the home page, login, and register pages are all working, the foundation is complete and ready for the next phase of development!
