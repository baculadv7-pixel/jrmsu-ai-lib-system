@echo off
echo Copying AI service files...

REM Create config directory if it doesn't exist
if not exist "mirror-login-page\src\config" mkdir "mirror-login-page\src\config"

REM Copy aiService.ts
copy /Y "jrmsu-wise-library-main\src\services\aiService.ts" "mirror-login-page\src\services\aiService.ts"

REM Copy api.ts config
copy /Y "jrmsu-wise-library-main\src\config\api.ts" "mirror-login-page\src\config\api.ts"

echo.
echo Files copied successfully!
echo - aiService.ts
echo - api.ts
echo.
pause
