# Deploying to Vercel (Static)

This project includes a static build path for Vercel. It converts Thymeleaf templates into static HTML, copies assets, and serves the resume PDF directly—no Java runtime on Vercel.

## What’s included
- Build script: scripts/build-static.js
- Config: vercel.json
- Output directory: public
- Generated files: public/index.html, public/resume.html, assets under public/

## One-time setup
```powershell
npm i -g vercel
vercel login
```

## Deploy
From the repository root:
```powershell
# Optional: run a local build to verify
node .\scripts\build-static.js

# Deploy to Vercel (interactive)
vercel

# Deploy production
vercel --prod
```

Vercel will run `npm run build:vercel` (configured in vercel.json), generate `public/`, and publish it.

## Routes
- `/` → public/index.html
- `/home` → `/`
- `/resume/view` → public/resume.html
- `/resume`, `/resume.pdf`, `/files/resume` → public/resume/VarshithResume.pdf

## Notes
- Vercel hosts a static site only (no Spring server).
- Static assets are copied from src/main/resources/static to public.
- Resume PDF is copied from src/main/resources/resume to public/resume.
- Edit templates or assets, then redeploy. The build script will regenerate `public/`.
