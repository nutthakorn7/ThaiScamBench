# Refactoring Plan

## Goal
Improve code quality, maintainability, and scalability across both Frontend and Backend, addressing the user's request to "refactor all code".

## Proposed Changes

### 1. Frontend Refactoring (`frontend/`)

#### A. Modularize `CheckPage` (`frontend/app/check/page.tsx`)
**Current State**: Large Client Component (~350 lines) mixing UI, API calls, and state management.
**Refactoring**:
- [NEW] `frontend/features/check/hooks/useScamDetection.ts`: Extract state and API logic into a custom hook.
- [NEW] `frontend/features/check/components/CheckForm.tsx`: Extract the input form.
- [NEW] `frontend/features/check/components/DetectionResult.tsx`: Extract the result card.
- [NEW] `frontend/features/check/components/LoadingOverlay.tsx`: Extract the loading animation.

#### B. Standardize API Calls
**Current State**: `frontend/lib/api.ts` contains raw `axios`/`fetch` calls.
**Refactoring**:
- Ensure strict typing for all request/response objects.
- Centralize error handling for consistently showing toasts.

### 2. Backend Refactoring (`backend/app/`)

#### A. Service Layer Improvements
- Ensure all business logic is in `services/`, not `routes/`.
- Review `app/services/detection_logger.py` and others for consistency.

#### B. Type Hints & Pydantic Config
- Ensure all route handlers utilize Pydantic models for validation (already mostly done, but verify).
- Add stricter return types.

#### C. Cleanup
- Remove unused imports.
- Standardize logging format (already using `logging.getLogger`, ensure consistency).

## Execution Strategy
1. **Frontend First**: The `check/page.tsx` file is the most user-facing and complex component that needs immediate cleanup.
2. **Backend Review**: detailed review of service logic.

## Verification
- Build and run the frontend to ensure no regressions.
- Test the `/check` flow manually.
