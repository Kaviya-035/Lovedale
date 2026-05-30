@echo off
echo.
echo === Pushing Lovedale to GitHub ===
echo.
git add -A
git status
git commit -m "fix: resolveMediaUrl for all images + Cloudinary + new features"
git push origin main
echo.
echo === Done! Vercel and Render will auto-deploy ===
echo.
pause
