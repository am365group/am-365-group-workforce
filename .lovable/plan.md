## Phase 1: UI Fixes & Registration Redesign
1. **Fix button text colors** — Audit all buttons where text blends with background
2. **Redesign Register page** — Remove BankID choice, direct multi-step form:
   - Step 1: Basic Info (First Name, Last Name, Phone, Email)
   - Step 2: Location (Street, Apt, City, Post Code)
   - Step 3: Who am I? (Swedish ID / Coordination Number)
   - Step 4: Transport (Bicycle, Moped/Scooter, Car)
   - Animated transitions between steps

## Phase 2: Database Schema
3. **Create partner registration & profiles tables** — Store partner applications, personal info, address, transport, verification status
4. **Create internal team/users tables** — Staff roles (Verifier, Controller, Admin)
5. **Create contracts table** — Partner contracts with signing status
6. **Create onboarding workflow table** — Track partner journey (registered → verified → contract sent → signed → active)

## Phase 3: Email Setup
7. **Set up email domain** for auth & transactional emails
8. **Create all email templates**:
   - Auth: Verification (OTP + link), Password reset
   - Transactional: Welcome, Document reminder, Contract signing, Contract confirmed, Schedule, Reminder, Notification, Verification done, ID expiration

## Phase 4: Onboarding Workflow
9. **Registration → Email verification (OTP)** → Save to DB
10. **Verifier reviews** → Edits contract → Sends for signoff
11. **Partner signs contract** → Welcome email → Published to resource pool

## Phase 5: Final QA
12. Test all flows end-to-end