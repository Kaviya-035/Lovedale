@echo off
git add -A
git commit -m "fix: Cloudinary upload for persistent images on Render + new features"
git push origin main
echo Done! Now add Cloudinary env vars to Render dashboard.
pause
