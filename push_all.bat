@echo off
git add -A
git commit -m "feat: free email notifications (Resend) for Thinking of You when partner offline"
git push origin main
echo Done! Now add RESEND_API_KEY to Render dashboard.
pause
