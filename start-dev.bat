@echo off
title VG Dev Environment
echo Starting Vision Graphics dev environment...
echo.

REM Clear Vite's pre-bundled deps cache — avoids stale "504 Outdated Optimize Dep"
REM errors after npm install / branch switches that break React island hydration
REM (galleries, image-compare). See CLAUDE.md "Vite dev cache gotcha".
if exist node_modules\.vite (
  echo Clearing node_modules\.vite ...
  rmdir /s /q node_modules\.vite
)

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
