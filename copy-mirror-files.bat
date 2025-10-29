@echo off
echo Copying files from main to mirror-login-page...

REM Create directories
mkdir "mirror-login-page\src\context" 2>nul
mkdir "mirror-login-page\src\services" 2>nul
mkdir "mirror-login-page\src\assets" 2>nul
mkdir "mirror-login-page\src\utils" 2>nul
mkdir "mirror-login-page\src\components\auth" 2>nul
mkdir "mirror-login-page\src\components\ui" 2>nul
mkdir "mirror-login-page\src\pages" 2>nul

REM Copy context
xcopy /Y "jrmsu-wise-library-main\src\context\AuthContext.tsx" "mirror-login-page\src\context\"

REM Copy services
xcopy /Y "jrmsu-wise-library-main\src\services\database.ts" "mirror-login-page\src\services\"
xcopy /Y "jrmsu-wise-library-main\src\services\qr.ts" "mirror-login-page\src\services\"
xcopy /Y "jrmsu-wise-library-main\src\services\activity.ts" "mirror-login-page\src\services\"
xcopy /Y "jrmsu-wise-library-main\src\services\notifications.ts" "mirror-login-page\src\services\"

REM Copy utils
xcopy /Y "jrmsu-wise-library-main\src\utils\totp.ts" "mirror-login-page\src\utils\"

REM Copy assets
xcopy /Y "jrmsu-wise-library-main\src\assets\jrmsu-logo.jpg" "mirror-login-page\src\assets\"

REM Copy auth components
xcopy /Y "jrmsu-wise-library-main\src\components\auth\QRCodeLogin.tsx" "mirror-login-page\src\components\auth\"
xcopy /Y "jrmsu-wise-library-main\src\components\auth\WelcomeMessage.tsx" "mirror-login-page\src\components\auth\"

REM Copy UI components
xcopy /Y /S "jrmsu-wise-library-main\src\components\ui\*.*" "mirror-login-page\src\components\ui\"

REM Copy Login page as LibraryEntry
xcopy /Y "jrmsu-wise-library-main\src\pages\Login.tsx" "mirror-login-page\src\pages\LibraryEntry.tsx"

echo Done!
pause
