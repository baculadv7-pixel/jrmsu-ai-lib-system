@echo off
echo ========================================
echo Installing Export Dependencies
echo ========================================
echo.

echo Installing jsPDF for PDF export...
call npm install jspdf

echo.
echo Installing jsPDF-AutoTable for table formatting...
call npm install jspdf-autotable

echo.
echo Installing XLSX for Excel export...
call npm install xlsx

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo You can now use the Export PDF and Export Excel buttons
echo in the Reports page (http://localhost:8080/reports)
echo.
pause
