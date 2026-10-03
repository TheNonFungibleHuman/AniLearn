@echo off
echo ========================================================
echo   Starting AniLearn - Visual Anime Learning Partner
echo   Powered by Google Gemini 3.8 Flash & Nano Banana
echo ========================================================
echo.

start "AniLearn Backend" cmd /k "node server.js"
start "AniLearn Frontend" cmd /k "npm run dev"

echo AniLearn services launched!
echo Frontend will be accessible at http://localhost:5175/ or http://localhost:5173/
echo.
pause
