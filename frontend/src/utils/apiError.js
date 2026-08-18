// FastAPI returns `detail` as a plain string for HTTPException, but as an
// array of { type, loc, msg, input } objects for Pydantic validation errors
// (422 responses). Rendering that array directly as a React child crashes
// the app, so this normalizes either shape into a displayable string.
export function apiErrorMessage(error, fallback = 'Something went wrong.') {
  const detail = error?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(d => d?.msg || fallback).join(' ');
  }
  return fallback;
}
