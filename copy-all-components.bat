@echo off
echo Copying ALL missing components from main to mirror...
echo.

REM Create all necessary directories
if not exist "mirror-login-page\src\components\qr" mkdir "mirror-login-page\src\components\qr"
if not exist "mirror-login-page\src\components\profile" mkdir "mirror-login-page\src\components\profile"
if not exist "mirror-login-page\src\components\admin" mkdir "mirror-login-page\src\components\admin"

REM Copy QR components
echo Copying QR components...
xcopy /Y /I "jrmsu-wise-library-main\src\components\qr\*.*" "mirror-login-page\src\components\qr\" 2>nul

REM Copy profile components
echo Copying profile components...
xcopy /Y /I "jrmsu-wise-library-main\src\components\profile\*.*" "mirror-login-page\src\components\profile\" 2>nul

REM Copy admin components
echo Copying admin components...
xcopy /Y /I "jrmsu-wise-library-main\src\components\admin\*.*" "mirror-login-page\src\components\admin\" 2>nul

echo.
echo All components copied!
echo.
pause
