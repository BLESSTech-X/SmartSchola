# Smart Schola — Frontend

## Quick Start (Windows Command Prompt)

```cmd
cd smartschola-frontend
npm install
copy .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:8000
```

```cmd
npm run dev
```
Open: http://localhost:5173

---

## Build for Production
```cmd
npm run build
```
Output is in the `dist/` folder.

---

## Deploy to Vercel

```cmd
npm install -g vercel
vercel login
vercel --prod
```

In Vercel Dashboard → Project → Settings → Environment Variables:
```
VITE_API_URL = https://your-backend.vercel.app
```

Redeploy:
```cmd
vercel --prod
```

---

## Features
- Dashboard with live stats
- Student management (add, edit, delete)
- Bulk mark entry with ECZ auto-grading
- Result viewer with PDF download
- Fee tracker with payment recording
- SMS center (all parents, defaulters, class, custom)
- Settings (school info, subjects, SMS, password)

## Login
Default: admin / schola2024
