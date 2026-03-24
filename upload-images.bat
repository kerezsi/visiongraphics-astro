@echo off
setlocal
set PROJECT=O:\VISIONGRAPHICS_ASTRO\visiongraphics-astro\public
set BUCKET=r2:visiongraphics-images
set FLAGS=--s3-no-check-bucket --progress

echo ============================================================
echo  Vision Graphics — Upload images to Cloudflare R2
echo  Bucket: visiongraphics-images
echo ============================================================
echo.

echo [1/4] Uploading portfolio images...
rclone copy "%PROJECT%\portfolio" %BUCKET%/portfolio %FLAGS%
if errorlevel 1 (echo    WARNING: some portfolio files failed) else (echo    OK)

echo.
echo [2/4] Uploading vision-tech images...
rclone copy "%PROJECT%\vision-tech" %BUCKET%/vision-tech %FLAGS%
if errorlevel 1 (echo    WARNING: some vision-tech files failed) else (echo    OK)

echo.
echo [3/4] Uploading hero images...
for %%F in (hero-bg.jpg hero-bg-2.jpg hero-bg-3.jpg hero-about.jpg) do (
    if exist "%PROJECT%\%%F" (
        rclone copy "%PROJECT%\%%F" %BUCKET% %FLAGS%
        echo    %%F uploaded
    ) else (
        echo    %%F not found locally — skipping
    )
)

echo.
echo [4/4] Uploading laszlo.jpg...
if exist "%PROJECT%\laszlo.jpg" (
    rclone copy "%PROJECT%\laszlo.jpg" %BUCKET% %FLAGS%
    echo    laszlo.jpg uploaded
) else (
    echo    laszlo.jpg not found locally — skipping
)

echo.
echo ============================================================
echo  Done. Re-run to retry any failed files — rclone skips
echo  files that already exist in R2 (compares size + modtime).
echo ============================================================
echo.
pause
