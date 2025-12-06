# Troubleshooting Guide - 文メイト Next.js

## Common Issues and Solutions

### 1. SWC Binary Error on Windows

**Error Message:**
```
⚠ Attempted to load @next/swc-win32-x64-msvc, but an error occurred
⨯ Failed to load SWC binary for win32/x64
```

**Solutions:**

#### Solution 1: Clean Install (Recommended)
```bash
# Delete node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Clean npm cache
npm cache clean --force

# Reinstall dependencies
npm install

# Try running dev server
npm run dev
```

#### Solution 2: Use Different Node Version
The SWC binary might not be compatible with your Node.js version. Try using Node.js LTS version (18.x or 20.x):

```bash
# Check your Node version
node --version

# If not using LTS, install Node.js LTS from https://nodejs.org
```

#### Solution 3: Use WSL2 (Windows Subsystem for Linux)
If the issue persists, consider using WSL2:

1. Install WSL2: https://docs.microsoft.com/en-us/windows/wsl/install
2. Install Node.js in WSL2
3. Run the project from WSL2

#### Solution 4: Disable SWC (Fallback to Babel)
Create or modify `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false,
  compiler: {
    // Disable SWC
  },
};

module.exports = nextConfig;
```

#### Solution 5: Install Visual C++ Redistributables
The SWC binary requires Visual C++ Redistributables:

1. Download from: https://aka.ms/vs/17/release/vc_redist.x64.exe
2. Install and restart your computer
3. Try `npm install` again

### 2. Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

#### Option 1: Kill the Process
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

#### Option 2: Use Different Port
```bash
# Run on port 3001 instead
npm run dev -- -p 3001
```

### 3. Module Not Found Errors

**Error Message:**
```
Module not found: Can't resolve 'module-name'
```

**Solutions:**

```bash
# Reinstall dependencies
npm install

# If specific module is missing
npm install <module-name>
```

### 4. TypeScript Errors

**Error Message:**
```
Type error: Cannot find module...
```

**Solutions:**

```bash
# Regenerate TypeScript types
npm run build

# Or restart TypeScript server in VS Code
# Press Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

### 5. Styling Not Applied

**Issue:** TailwindCSS classes not working

**Solutions:**

1. Check `tailwind.config.ts` content paths
2. Ensure `globals.css` imports Tailwind directives
3. Restart dev server

```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

### 6. Hot Reload Not Working

**Solutions:**

```bash
# Clear Next.js cache
Remove-Item -Recurse -Force .next

# Restart dev server
npm run dev
```

### 7. Build Errors

**Error Message:**
```
Error occurred prerendering page
```

**Solutions:**

1. Check for client-side only code in server components
2. Add `'use client'` directive where needed
3. Check console for specific errors

```bash
# Try building
npm run build

# Check for errors in output
```

### 8. Environment Variables Not Loading

**Solutions:**

1. Create `.env.local` file in project root
2. Prefix public variables with `NEXT_PUBLIC_`
3. Restart dev server after adding env variables

```bash
# Example .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
DATABASE_URL=your_database_url
```

### 9. Images Not Loading

**Solutions:**

1. Place images in `public/` directory
2. Reference with `/image-name.png` (leading slash)
3. For external images, configure `next.config.js`:

```javascript
module.exports = {
  images: {
    domains: ['example.com'],
  },
};
```

### 10. Slow Performance

**Solutions:**

```bash
# Clear cache
Remove-Item -Recurse -Force .next
npm cache clean --force

# Reinstall
npm install

# Use production build for testing
npm run build
npm start
```

## Getting Help

### Check Logs
Always check the terminal output for specific error messages.

### Next.js Documentation
- https://nextjs.org/docs
- https://nextjs.org/docs/messages/failed-loading-swc

### Community Support
- Next.js GitHub: https://github.com/vercel/next.js/discussions
- Stack Overflow: Tag `next.js`

### Project-Specific Issues

If you encounter issues specific to this project:

1. Check `README.md` for setup instructions
2. Review `PROJECT_SUMMARY.md` for project details
3. Check `TODO.md` for known limitations

## Preventive Measures

### Before Starting Development

1. **Use LTS Node.js version** (18.x or 20.x)
2. **Keep dependencies updated** (but test after updates)
3. **Use consistent package manager** (npm, not mixing with yarn/pnpm)
4. **Clear cache regularly** when switching branches

### During Development

1. **Restart dev server** after installing new packages
2. **Clear `.next` folder** if you see caching issues
3. **Check console** for warnings and errors
4. **Use TypeScript** for better error detection

### Best Practices

1. **Commit `package-lock.json`** to version control
2. **Don't commit `node_modules`** or `.next`
3. **Use `.env.local`** for local environment variables
4. **Test builds** before deploying (`npm run build`)

---

**Last Updated**: December 4, 2024
