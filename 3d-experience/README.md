# VeytronaTech 3D experience

Standalone redesign of the VeytronaTech site. This folder does not replace or modify the current website files.

## Run locally

```powershell
cd "3d-experience"
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## What you get

- Full-viewport WebGL scene with a living core, orbiting service nodes, bloom, and starfield
- Drag to orbit, hover/click nodes, and scroll to move the camera
- Same studio content: about, services, selected work, solution builder, and contact
- Contact form still posts to `/api/contact` when this build is served next to the existing API

## Build

```powershell
npm run build
npm run preview
```
