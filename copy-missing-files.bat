@echo off
echo Copying missing files from main to mirror...
echo.

REM Create directories if they don't exist
if not exist "mirror-login-page\src\components\auth" mkdir "mirror-login-page\src\components\auth"
if not exist "mirror-login-page\src\config" mkdir "mirror-login-page\src\config"

REM Copy auth components
echo Copying auth components...
copy /Y "jrmsu-wise-library-main\src\components\auth\ForgotPasswordOverlay.tsx" "mirror-login-page\src\components\auth\ForgotPasswordOverlay.tsx" 2>nul
if not exist "mirror-login-page\src\components\auth\ForgotPasswordOverlay.tsx" (
    copy /Y "jrmsu-wise-library-main\src\components\auth\ForgotPasswordOverlay.js" "mirror-login-page\src\components\auth\ForgotPasswordOverlay.tsx" 2>nul
)

REM Copy all auth components
xcopy /Y /I "jrmsu-wise-library-main\src\components\auth\*.*" "mirror-login-page\src\components\auth\" 2>nul

echo.
echo Files copied!
echo.
pause
