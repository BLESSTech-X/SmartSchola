# SmartSchola frontend

This is the active React application. It communicates only with the Cloudflare Worker API and stores its application data in Cloudflare D1.

## Local development

```bash
cd smartschola-frontend
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` in `.env` to the local or deployed Cloudflare Worker URL. Do not configure Supabase or a legacy FastAPI/Vercel backend.

## Build

```bash
npm run build
```

## Deployment configuration

Set `VITE_API_URL` to the Cloudflare Worker URL in the frontend hosting environment. Configure the matching frontend origin in the Worker `ALLOWED_ORIGINS` variable.

## Application modules

The application uses Cloudflare Worker endpoints for authentication, school directory, students, classes, academic years, assessments and scores, attendance, school settings, fees, results, platform administration, student/parent account linking and SMS logs/delivery.

SMS sending requires Africa's Talking credentials configured as Cloudflare Worker secrets. File uploads and automated email delivery are not enabled yet.
