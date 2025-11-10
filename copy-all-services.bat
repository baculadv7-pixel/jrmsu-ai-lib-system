@echo off
echo Copying ALL services...
xcopy /Y /I "jrmsu-wise-library-main\src\services\*.*" "mirror-login-page\src\services\"
echo Done!
pause
