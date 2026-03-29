@echo off
setlocal
cd /d "D:\sites\visiongraphics-astro"

echo ============================================================
echo  Vision Graphics — Git push to GitHub
echo  Auto-deploys to: visiongraphics-astro.pages.dev
echo ============================================================
echo.

echo Current status:
git status --short
echo.

set /p MSG="Commit message (leave blank to push existing commits): "

if "%MSG%"=="" (
    echo Pushing existing commits without a new commit...
) else (
    git add -A
    git commit -m "%MSG%"
    if errorlevel 1 (
        echo Nothing to commit.
    )
)

echo.
echo Pushing to GitHub...
git push origin master
if errorlevel 1 (
    echo ERROR: push failed. Check your connection or credentials.
) else (
    echo.
    echo Done! Cloudflare Pages will deploy in ~1 minute.
    echo   https://visiongraphics-astro.pages.dev
)

echo.
pause
