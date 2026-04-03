@echo off
title VG Dev Environment
echo Starting Vision Graphics dev environment...
echo.


start "Editor Server (4322)"  cmd /k "npm run editor:server"

timeout /t 5 /nobreak >nul
start "Astro Dev (4321)"      cmd /k "npm run dev"

timeout /t 20 /nobreak >nul
start "Editor Client (4323)"  cmd /k "npm run editor:client"

echo.
echo  Astro dev:     http://localhost:4321
echo  Keystatic CMS: http://localhost:4321/keystatic
echo  Editor:        http://localhost:4323
echo.
