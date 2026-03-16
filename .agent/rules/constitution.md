---
PROJECT: PlatePulse — Smart Food Waste Redistribution Platform
STACK: Node.js 20, Express.js 4, MongoDB Atlas, Redis, Socket.io,
       React 18 + Vite, Tailwind CSS v3, Zustand, React Query
ARCHITECTURE RULES:
- All business logic lives in server/src/services/ only
- Controllers only: parse request → call service → send response
- Never run cron logic inside Express request handlers
- All async functions use async/await, no callbacks
- Every API response format: { success, message, data } or
  { success, data, pagination } or { success: false, message, errors }
- All routes prefixed /api/v1/
- Never store images in MongoDB or local disk
- Refresh token in HttpOnly cookie only
- Access token in memory only, never localStorage
COLOR PALETTE:
- primary: #2E7D32, secondary: #4CAF50, accent: #FF9800
- highlight: #FFC107, surface: #F5F7F6, text: #2C2C2C
FONTS: Inter (body), Plus Jakarta Sans (headings)
---
