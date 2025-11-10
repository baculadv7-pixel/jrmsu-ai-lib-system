@echo off
echo ========================================
echo JRMSU Library Database Setup
echo ========================================
echo.

echo Creating missing database tables...
echo.

REM Run the SQL file
mysql -u root -p jrmsu_library < create_missing_tables.sql

echo.
echo ========================================
echo Setup complete!
echo ========================================
echo.
echo You can now run: python app.py
echo.
pause
