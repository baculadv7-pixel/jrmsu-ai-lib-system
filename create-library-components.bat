@echo off
echo Creating library component index file...

REM Create index file for easy imports
(
echo export { BookPickupDialog } from './BookPickupDialog';
echo export { BookReturnDialog } from './BookReturnDialog';
echo export { BookScannerDialog } from './BookScannerDialog';
echo export { LogoutBookScan } from './LogoutBookScan';
echo export { CancelReservationButton } from './CancelReservationButton';
) > "mirror-login-page\src\components\library\index.ts"

echo Library components index created!
echo.
echo All 5 library components created:
echo 1. BookPickupDialog.tsx
echo 2. BookReturnDialog.tsx
echo 3. BookScannerDialog.tsx
echo 4. LogoutBookScan.tsx
echo 5. CancelReservationButton.tsx
echo.
pause
