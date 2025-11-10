@echo off
echo Installing Python QR Detection Backend Dependencies...
echo.

REM Check if Python is installed
python --version > nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo Python found. Installing dependencies...

REM Install required packages
pip install opencv-python==4.8.1.78
pip install pyzbar==0.1.9
pip install numpy==1.24.3
pip install Pillow==10.0.1

echo.
echo Installation complete!
echo.
echo To test the QR detector, run:
echo   python qr_detector.py
echo.
pause