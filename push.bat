@echo off
git add -A
git commit -m "fix: deploy config - CORS, API URL, vercel.json, photo editor, status features"
git push origin main
echo Done!
pause
