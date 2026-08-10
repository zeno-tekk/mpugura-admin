const ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'The email or password you entered is incorrect.',
  'auth/wrong-password': 'The email or password you entered is incorrect.',
  'auth/user-not-found': 'The email or password you entered is incorrect.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Please allow popups for this site and try again.',
  'auth/email-already-in-use': 'That email address is already in use.',
  'auth/weak-password': 'Choose a password with at least 6 characters.',
  'auth/requires-recent-login': 'Please sign out and sign in again, then retry.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled.',
  'permission-denied': "You don't have permission to do that.",
  unavailable: 'Service is temporarily unavailable. Please try again.',
  'not-found': 'That record could not be found.',
  'already-exists': 'That record already exists.',
  'resource-exhausted': 'Too many requests. Please try again shortly.',
  'deadline-exceeded': 'The request timed out. Please try again.',
  unauthenticated: 'Your session expired. Please sign in again.',
};

function getErrorCode(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code?: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return '';
}

/**
 * Turns Firebase Auth/Firestore error codes (and raw SDK error strings like
 * "Firebase: Error (auth/invalid-credential).") into short, user-friendly text.
 * Custom `throw new Error('...')` messages from our own code pass through unchanged.
 */
export function getFriendlyErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  const code = getErrorCode(err);
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];

  if (err instanceof Error && err.message && !/^Firebase:/i.test(err.message) && !/\[code=/i.test(err.message)) {
    return err.message;
  }

  return fallback;
}
