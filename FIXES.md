# AgriSync fixes

## Authentication
- Farmer login/register keeps phone validation.
- Customer login and registration now accept either phone or email.
- Login/register buttons prevent duplicate submissions.
- Role-specific credentials are sent cleanly to the backend.
- Auth state safely rehydrates from `/api/auth/me` and clears invalid sessions.
- Backend rejects weak passwords and normalizes identifiers.

## AgriSync Agent
- Supports typed questions and microphone speech-to-text.
- Hindi/English microphone mode can be selected.
- Answers are returned as text.
- Voice answers use Hindi (`hi-IN`) for Hindi/Devanagari responses and English (`en-IN`) for English responses when the browser provides a matching voice.
- Mandi-rate and pickup-slot questions use application data directly instead of letting the LLM invent live information.
- The agent can read the currently open pickup slots from MongoDB.
- Fixed OpenAI-compatible LLM URL handling when `LLM_BASE_URL` already ends in `/v1`.

## data.gov.in mandi data
- Added request timeout and clearer errors.
- Added short-lived caching.
- Added normalization for government field names and numeric prices.
- Added stale-cache use when a live request fails.
- Sample data is explicitly labelled as demo when live data is unavailable.
- The official mandi resource ID remains `9ef84268-d588-465a-a308-a864a43d0070`.

## Security
- The supplied real `.env` file was intentionally not included in the fixed ZIP.
- Fill in `backend/.env` from `backend/.env.example` before running.
- Do not commit `.env` files to Git.
