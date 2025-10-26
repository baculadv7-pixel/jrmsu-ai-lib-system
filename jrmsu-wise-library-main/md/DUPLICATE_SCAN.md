JRMSU Library System — Duplicate/Temporary/Test File Scan

This report lists files that match patterns: normal, basic, demo, simple, test, testing, tmp, temp.

Notes:
- Many matches come from the Python virtual environment under python-backend/.venv — these are third-party packages and should NOT be modified.
- The items below are within the project repo tree and are candidates for cleanup or archival after manual review.

Candidates in repository (outside venv):
- qr_debug_test.html
- qr_system_accuracy_test.html
- src/utils/qr-e2e-test.ts
- src/utils/qr-scannability-test.ts
- src/utils/qr-structure-test.ts
- src/utils/qr-test.ts
- src/utils/test-qr-generator.ts
- tests/aiService.test.ts

Recommended action:
- Keep tests if used in CI/local QA. If not required in production build, move under tests/ or docs/ and exclude from build.
- No duplicates of production components found.
- No files named normal/basic/demo/simple/tmp/temp in src/ components/pages were detected.

Next steps:
- Confirm whether the QR test utilities should be moved under tests/ and excluded from production bundles.
- If yes, update tsconfig/vite config to exclude tests from build or move them physically.
