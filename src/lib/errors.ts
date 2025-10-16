
import type { SecurityRuleContext } from './types';

/**
 * A custom error class for Firestore permission-denied errors.
 * This class encapsulates the context of the failed Firestore request,
 * providing detailed information for debugging security rules.
 */
export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(context, null, 2)}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is necessary for the stack trace to be correct in some environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FirestorePermissionError);
    }
  }
}
