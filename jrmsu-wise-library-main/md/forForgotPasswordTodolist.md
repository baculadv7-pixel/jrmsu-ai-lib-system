# Forgot Password Implementation – Task Checklist

Owner: Frontend
Scope: JRMSU AI Library System (web)
Target route: `/forgot-password`

## 0) Planning & Scaffold
- [ ] Confirm UX spec in `frontend_auth_forgot_password_instructions.txt`
- [ ] Add route in `src/App.tsx` → lazy page `ForgotPassword.tsx`
- [ ] Create page file `src/pages/ForgotPassword.tsx`
- [ ] Add navigation entry (optional link on Login page)

## 1) UI & State Machine
- [ ] Build selector (radio/dropdown): Email / Message Admin / 2FA (conditional)
- [ ] Dynamic section that renders the chosen flow
- [ ] Shared password fields with eye visibility toggle (New + Confirm)
- [ ] Loading and success/error toasts via `use-toast`
- [ ] Disable buttons during async ops
- [ ] Responsive layout (desktop side-by-side, tablet stacked, mobile collapsible)

## 2) Flow A — Email Verification
- [ ] Form: Registered Email
- [ ] Button: Send Reset Code → POST `/api/auth/request-reset`
- [ ] Handle responses: show code field when email accepted
- [ ] Form: 6-digit code → POST `/api/auth/verify-code`
- [ ] On valid code → show password create form
- [ ] Validate password: min 8 chars, match confirm
- [ ] Final submit: POST `/api/auth/reset-password`
- [ ] On success: update local user if logged-in session exists, toast success
- [ ] Log: `ActivityService.log(userId,'password_reset_email')`

## 3) Flow B — Message the Admin
- [ ] Form: Registered Email or ID
- [ ] Button: Send Request → POST `/api/auth/request-reset` with mode=`admin` (or local fallback)
- [ ] Notify admin: `NotificationsService.add` (message with approve/deny)
- [ ] Real-time approval: BroadcastChannel `jrmsu_password_reset_approval` or polling
- [ ] On approval → show password create form
- [ ] Save password via `databaseService.setUserPassword(userId, newPassword)` (dev fallback)
- [ ] Log: `ActivityService.log(userId,'password_reset_admin')`

## 4) Flow C — 2FA Code (if enabled)
- [ ] Detect eligibility: user has `twoFactorEnabled`
- [ ] Form: 6-digit TOTP code
- [ ] Verify TOTP via `totp.verify(code, secret)` (or backend `/api/auth/verify-2fa`)
- [ ] On success → show password create form
- [ ] Save password via API or `databaseService.setUserPassword`
- [ ] Log: `ActivityService.log(userId,'password_reset_2fa')`

## 5) Security & Validations
- [ ] Rate-limit Send Reset Code (e.g., 1/min per email)
- [ ] Codes: one-time use, 10 min expiry, invalidate after success
- [ ] Strong password policy (min 8, recommend mix chars)
- [ ] Do NOT echo secrets to logs; show generic errors
- [ ] Handle CORS/dev mode: use local fallbacks when API unavailable

## 6) Backend Integration (stubs OK for dev)
- [ ] Implement API client wrappers: requestReset, verifyCode, resetPassword
- [ ] Wire to real endpoints when ready; keep dev fallbacks (local storage + mock store)
- [ ] Ensure bcrypt hashing server-side; in dev, use `databaseService.setUserPassword` (v2 salted)

## 7) Notifications & Activity
- [ ] User toasts for each milestone (code sent, verified, reset)
- [ ] Admin notifications for requests; approve/deny actions
- [ ] Recent Account Activity entries (type, timestamp)

## 8) Accessibility
- [ ] Labels/aria for inputs and toggles
- [ ] Keyboard navigation (tab flow, Enter on forms)
- [ ] `aria-live` for async status messages

## 9) Testing
- [ ] Unit: state machine per flow (happy + error paths)
- [ ] Integration: email flow with mock API
- [ ] Admin flow real-time approval simulation
- [ ] 2FA validation (valid/invalid/expired)
- [ ] Responsive snapshot checks (desktop/tablet/mobile)

## 10) QA Checklist
- [ ] All three methods work independently
- [ ] DB updates reflect immediately; session sync if applicable
- [ ] Admin gets notifications and actions function
- [ ] No UI regressions (colors/theme unchanged)
- [ ] Works in DevTools device toolbar without layout overflow

## 11) Delivery
- [ ] PR with page, route, services, and tests
- [ ] Lint/typecheck: `npm run lint && npm run build`
- [ ] Demo script for stakeholders

