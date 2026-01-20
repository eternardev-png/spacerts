# SpaceRTS Launch Script v3

Write-Host "Starting SpaceRTS Servers..."

# Launch Backend (Python)
# using cmd /k to keep window open if it crashes, convenient for logs
$backend = Start-Process -FilePath "cmd" -ArgumentList "/k cd backend && python main.py" -PassThru -WindowStyle Minimized

# Launch Frontend (npm)
# using cmd /k to ensure npm path is resolved correctly by the shell
$frontend = Start-Process -FilePath "cmd" -ArgumentList "/k cd frontend && npm run dev" -PassThru -WindowStyle Minimized

Write-Host "Servers launching... (Waiting 5s)"
Start-Sleep -Seconds 5

# Open Chrome
$url = "http://localhost:5173"
Write-Host "Opening $url"
Start-Process "chrome" $url

Write-Host "
==============================================
   GAME RUNNING
==============================================
- Frontend: http://localhost:5173
- Backend:  http://localhost:8000

Check the minimized windows for logs if something breaks.

Press ENTER to close servers and exit.
"
Read-Host

# Cleanup
# Note: Stopping cmd processes might leave child processes (node/python) running in some cases,
# but this is usually sufficient for a dev helper.
Stop-Process -Id $frontend.Id -ErrorAction SilentlyContinue
Stop-Process -Id $backend.Id -ErrorAction SilentlyContinue
Write-Host "Done."
